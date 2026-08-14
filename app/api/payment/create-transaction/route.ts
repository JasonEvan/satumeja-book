import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { calculateBookingTotals } from "@/lib/booking-pricing";
import { createMidtransOrderId, createMidtransSnapTransaction } from "@/lib/midtrans";
import type { RatesData, StoreSettingsData } from "@/lib/booking-types";
import { createPublicServerClient } from "@/utils/supabase/public-server";

export const runtime = "nodejs";

interface CreateTransactionPayload {
  name?: unknown;
  phone?: unknown;
  assetId?: unknown;
  date?: unknown;
  startHour?: unknown;
  endHour?: unknown;
  voucherCode?: unknown;
}

interface AssetRow {
  id: string;
  outlet_id: string;
  menu_item_id: string;
  asset_name: string;
  status: string;
}

interface StoreSettingsRow {
  tax_percentage: number | null;
  service_charge_percentage: number | null;
  weekend_days: number[] | null;
}

interface VoucherRow {
  code: string;
  discount_type: string;
  discount_value: number;
  min_spend: number | null;
  max_discount_amount: number | null;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function normalizePayload(body: CreateTransactionPayload) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const assetId = typeof body.assetId === "string" ? body.assetId : "";
  const date = typeof body.date === "string" ? body.date : "";
  const startHour =
    typeof body.startHour === "number" ? body.startHour : Number(body.startHour);
  const endHour =
    typeof body.endHour === "number" ? body.endHour : Number(body.endHour);
  const voucherCode =
    typeof body.voucherCode === "string" && body.voucherCode.trim()
      ? body.voucherCode.trim().toUpperCase()
      : null;

  return { name, phone, assetId, date, startHour, endHour, voucherCode };
}

function buildRatesData(
  rules: Array<{ id: string; day_type: string }>,
  tiers: Array<{
    rule_id: string;
    from_hour: number;
    to_hour: number | null;
    price_per_hour: number;
  }>,
): RatesData {
  const data: RatesData = { weekday: [], weekend: [] };

  for (const rule of rules) {
    const target = rule.day_type === "weekend" ? data.weekend : data.weekday;

    tiers
      .filter((tier) => tier.rule_id === rule.id)
      .sort((a, b) => a.from_hour - b.from_hour)
      .forEach((tier) => {
        target.push({
          minHour: tier.from_hour,
          maxHour: tier.to_hour ?? Number.POSITIVE_INFINITY,
          rate: Number(tier.price_per_hour),
        });
      });
  }

  return data;
}

function buildStoreSettings(row: StoreSettingsRow | null): StoreSettingsData {
  return {
    taxPercentage: Number(row?.tax_percentage || 0),
    serviceChargePercentage: Number(row?.service_charge_percentage || 0),
    weekendDays:
      row?.weekend_days?.map((value) => Number(value)).filter(Number.isFinite) ||
      [0, 5, 6],
  };
}

function buildVoucherDiscount(voucher: VoucherRow | null, subtotal: number) {
  if (!voucher) {
    return null;
  }

  const minSpend = Number(voucher.min_spend || 0);

  if (subtotal < minSpend) {
    throw new Error(`Voucher hanya berlaku untuk minimum transaksi Rp${minSpend.toLocaleString("id-ID")}.`);
  }

  let amount =
    voucher.discount_type === "percentage"
      ? subtotal * (Number(voucher.discount_value) / 100)
      : Number(voucher.discount_value);

  if (voucher.max_discount_amount) {
    amount = Math.min(amount, Number(voucher.max_discount_amount));
  }

  return {
    type: voucher.discount_type === "percentage" ? ("percent" as const) : ("flat" as const),
    value:
      voucher.discount_type === "percentage"
        ? Number(voucher.discount_value)
        : Math.round(amount),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateTransactionPayload;
    const { name, phone, assetId, date, startHour, endHour, voucherCode } =
      normalizePayload(body);

    if (!name || !phone || !assetId || !date) {
      return jsonError("Data booking belum lengkap.");
    }

    if (!Number.isInteger(startHour) || !Number.isInteger(endHour) || endHour <= startHour) {
      return jsonError("Jam booking tidak valid.");
    }

    const supabase = createPublicServerClient();

    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("id, outlet_id, menu_item_id, asset_name, status")
      .eq("id", assetId)
      .maybeSingle<AssetRow>();

    if (assetError || !asset) {
      return jsonError("Meja yang dipilih tidak ditemukan.", 404);
    }

    if (asset.status === "maintenance") {
      return jsonError("Meja sedang tidak tersedia.");
    }

    const [{ data: settings }, { data: rules }, { data: vouchers }] = await Promise.all([
      supabase
        .from("store_settings")
        .select("tax_percentage, service_charge_percentage, weekend_days")
        .eq("outlet_id", asset.outlet_id)
        .limit(1)
        .maybeSingle<StoreSettingsRow>(),
      supabase
        .from("rental_pricing_rules")
        .select("id, day_type")
        .eq("menu_item_id", asset.menu_item_id),
      voucherCode
        ? supabase
            .from("vouchers")
            .select(
              "code, discount_type, discount_value, min_spend, max_discount_amount",
            )
            .eq("code", voucherCode)
            .eq("is_active", true)
            .limit(1)
            .maybeSingle<VoucherRow>()
        : Promise.resolve({ data: null }),
    ]);

    const pricingRuleIds = (rules || []).map((rule) => rule.id);
    const { data: tiers, error: tiersError } = pricingRuleIds.length
      ? await supabase
          .from("rental_pricing_tiers")
          .select("rule_id, from_hour, to_hour, price_per_hour")
          .in("rule_id", pricingRuleIds)
      : { data: [], error: null };

    if (tiersError) {
      return jsonError("Gagal memuat tarif booking.", 500);
    }

    const rates = buildRatesData(rules || [], tiers || []);

    if (!rates.weekday.length && !rates.weekend.length) {
      return jsonError("Tarif booking belum dikonfigurasi.", 500);
    }

    const totalHours = endHour - startHour;
    const bookingDate = new Date(`${date}T00:00:00`);

    const preliminaryTotals = calculateBookingTotals({
      totalHours,
      dateObj: bookingDate,
      activeRates: rates,
      appliedVoucher: null,
      storeSettings: buildStoreSettings(settings || null),
    });

    const voucherDiscount = buildVoucherDiscount(vouchers || null, preliminaryTotals.subtotal);

    const totals = calculateBookingTotals({
      totalHours,
      dateObj: bookingDate,
      activeRates: rates,
      appliedVoucher: voucherDiscount,
      storeSettings: buildStoreSettings(settings || null),
    });

    const startedAtIso = `${date}T${String(startHour).padStart(2, "0")}:00:00+07:00`;
    const durationMinutes = totalHours * 60;
    const midtransOrderId = createMidtransOrderId();
    const fallbackRentalId = randomUUID();

    const { data: bookingData, error: bookingError } = await supabase.rpc(
      "create_web_booking_payment",
      {
        p_rental_id: fallbackRentalId,
        p_outlet_id: asset.outlet_id,
        p_asset_id: asset.id,
        p_customer_name: name,
        p_customer_phone: phone,
        p_started_at: startedAtIso,
        p_duration_minutes: durationMinutes,
        p_hourly_rate: totals.rate,
        p_gross_amount: totals.total,
        p_midtrans_order_id: midtransOrderId,
        p_voucher_code: voucherCode,
      },
    );

    if (bookingError) {
      return jsonError(bookingError.message || "Gagal menahan slot booking.", 400);
    }

    try {
      const midtrans = await createMidtransSnapTransaction({
        orderId: midtransOrderId,
        grossAmount: totals.total,
        customerName: name,
        customerPhone: phone,
      });

      return NextResponse.json({
        snapToken: midtrans.token,
        redirectUrl: midtrans.redirect_url || null,
        orderId: midtransOrderId,
        rentalId: bookingData?.rental_id || fallbackRentalId,
        paymentExpiresAt: bookingData?.payment_expired_at || null,
      });
    } catch (midtransError) {
      await supabase.rpc("update_web_booking_payment_status", {
        p_order_id: midtransOrderId,
        p_status: "payment_failed",
        p_payment_method: null,
        p_transaction_id: null,
      });

      const message =
        midtransError instanceof Error
          ? midtransError.message
          : "Gagal membuat transaksi pembayaran.";

      return jsonError(message, 502);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan pada server.";

    return jsonError(message, 500);
  }
}
