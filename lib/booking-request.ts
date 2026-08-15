import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { calculateBookingTotals } from "@/lib/booking-pricing";
import type { RatesData, StoreSettingsData } from "@/lib/booking-types";
import {
  DEFAULT_PAYMENT_GATEWAY_ENABLED,
  getPaymentGatewayEnabled,
} from "@/lib/payment-settings";

export interface CreateBookingPayload {
  name?: unknown;
  phone?: unknown;
  assetId?: unknown;
  date?: unknown;
  startHour?: unknown;
  endHour?: unknown;
  voucherCode?: unknown;
}

export interface NormalizedBookingPayload {
  name: string;
  phone: string;
  assetId: string;
  date: string;
  startHour: number;
  endHour: number;
  voucherCode: string | null;
}

export interface AssetRow {
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
  payment_gateway_enabled?: boolean | null;
  opening_hour?: number | string | null;
  closing_hour?: number | string | null;
  open_hour?: number | string | null;
  close_hour?: number | string | null;
  opening_time?: string | null;
  closing_time?: string | null;
  open_time?: string | null;
  close_time?: string | null;
}

interface VoucherRow {
  code: string;
  discount_type: string;
  discount_value: number;
  min_spend: number | null;
  max_discount_amount: number | null;
}

export interface BookingQuoteResult {
  asset: AssetRow;
  storeSettings: StoreSettingsData;
  totals: ReturnType<typeof calculateBookingTotals>;
  normalizedVoucherCode: string | null;
  paymentGatewayEnabled: boolean;
}

export function normalizeBookingPayload(body: CreateBookingPayload) {
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
  const parseHour = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.max(0, Math.min(23, Math.trunc(value)));
    }

    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{1,2})(?::\d{2})?(?::\d{2})?$/);
    if (!match) {
      return null;
    }

    const hour = Number(match[1]);
    return hour >= 0 && hour <= 23 ? hour : null;
  };

  const openingHour =
    parseHour(
      row?.opening_hour ?? row?.open_hour ?? row?.opening_time ?? row?.open_time,
    ) ?? 10;
  const closingHour =
    parseHour(
      row?.closing_hour ?? row?.close_hour ?? row?.closing_time ?? row?.close_time,
    ) ?? 23;

  return {
    taxPercentage: Number(row?.tax_percentage || 0),
    serviceChargePercentage: Number(row?.service_charge_percentage || 0),
    weekendDays:
      row?.weekend_days?.map((value) => Number(value)).filter(Number.isFinite) ||
      [0, 5, 6],
    paymentGatewayEnabled: getPaymentGatewayEnabled(row),
    openingHour,
    closingHour: closingHour >= openingHour ? closingHour : 23,
  };
}

function buildVoucherDiscount(voucher: VoucherRow | null, subtotal: number) {
  if (!voucher) {
    return null;
  }

  const minSpend = Number(voucher.min_spend || 0);

  if (subtotal < minSpend) {
    throw new Error(
      `Voucher hanya berlaku untuk minimum transaksi Rp${minSpend.toLocaleString("id-ID")}.`,
    );
  }

  let amount =
    voucher.discount_type === "percentage"
      ? subtotal * (Number(voucher.discount_value) / 100)
      : Number(voucher.discount_value);

  if (voucher.max_discount_amount) {
    amount = Math.min(amount, Number(voucher.max_discount_amount));
  }

  return {
    type:
      voucher.discount_type === "percentage"
        ? ("percent" as const)
        : ("flat" as const),
    value:
      voucher.discount_type === "percentage"
        ? Number(voucher.discount_value)
        : Math.round(amount),
  };
}

export async function fetchBookingQuote(
  supabase: SupabaseClient,
  input: NormalizedBookingPayload,
): Promise<BookingQuoteResult> {
  const { assetId, date, startHour, endHour, voucherCode } = input;

  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .select("id, outlet_id, menu_item_id, asset_name, status")
    .eq("id", assetId)
    .maybeSingle<AssetRow>();

  if (assetError || !asset) {
    throw new Error("Meja yang dipilih tidak ditemukan.");
  }

  if (asset.status === "maintenance") {
    throw new Error("Meja sedang tidak tersedia.");
  }

  const [{ data: settings }, { data: rules }, { data: vouchers }] =
    await Promise.all([
      supabase
        .from("store_settings")
        .select(
          "tax_percentage, service_charge_percentage, weekend_days, payment_gateway_enabled, opening_hour, closing_hour, open_hour, close_hour, opening_time, closing_time, open_time, close_time",
        )
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
    throw new Error("Gagal memuat tarif booking.");
  }

  const rates = buildRatesData(rules || [], tiers || []);

  if (!rates.weekday.length && !rates.weekend.length) {
    throw new Error("Tarif booking belum dikonfigurasi.");
  }

  const totalHours = endHour - startHour;
  const bookingDate = new Date(`${date}T00:00:00`);
  const storeSettings = buildStoreSettings(settings || null);

  const preliminaryTotals = calculateBookingTotals({
    totalHours,
    dateObj: bookingDate,
    activeRates: rates,
    appliedVoucher: null,
    storeSettings,
  });

  const voucherDiscount = buildVoucherDiscount(
    vouchers || null,
    preliminaryTotals.subtotal,
  );

  const totals = calculateBookingTotals({
    totalHours,
    dateObj: bookingDate,
    activeRates: rates,
    appliedVoucher: voucherDiscount,
    storeSettings,
  });

  return {
    asset,
    storeSettings,
    totals,
    normalizedVoucherCode: voucherCode,
    paymentGatewayEnabled:
      settings?.payment_gateway_enabled ?? DEFAULT_PAYMENT_GATEWAY_ENABLED,
  };
}

export async function reserveBooking(
  supabase: SupabaseClient,
  input: NormalizedBookingPayload & {
    asset: AssetRow;
    grossAmount: number;
    hourlyRate: number;
    orderId: string;
  },
) {
  const totalHours = input.endHour - input.startHour;
  const startedAtIso = `${input.date}T${String(input.startHour).padStart(2, "0")}:00:00+07:00`;
  const durationMinutes = totalHours * 60;
  const fallbackRentalId = randomUUID();

  const { data, error } = await supabase.rpc("create_web_booking_payment", {
    p_rental_id: fallbackRentalId,
    p_outlet_id: input.asset.outlet_id,
    p_asset_id: input.asset.id,
    p_customer_name: input.name,
    p_customer_phone: input.phone,
    p_started_at: startedAtIso,
    p_duration_minutes: durationMinutes,
    p_hourly_rate: input.hourlyRate,
    p_gross_amount: input.grossAmount,
    p_midtrans_order_id: input.orderId,
    p_voucher_code: input.voucherCode,
  });

  if (error) {
    throw new Error(error.message || "Gagal menahan slot booking.");
  }

  return {
    rentalId: data?.rental_id || fallbackRentalId,
    paymentExpiresAt: data?.payment_expired_at || null,
  };
}
