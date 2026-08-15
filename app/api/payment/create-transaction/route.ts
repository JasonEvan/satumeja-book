import { NextResponse } from "next/server";

import {
  fetchBookingQuote,
  normalizeBookingPayload,
  reserveBooking,
  type CreateBookingPayload,
} from "@/lib/booking-request";
import { createMidtransOrderId, createMidtransSnapTransaction } from "@/lib/midtrans";
import { createPublicServerClient } from "@/utils/supabase/public-server";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateBookingPayload;
    const { name, phone, assetId, date, startHour, endHour, voucherCode } =
      normalizeBookingPayload(body);

    if (!name || !phone || !assetId || !date) {
      return jsonError("Data booking belum lengkap.");
    }

    if (!Number.isInteger(startHour) || !Number.isInteger(endHour) || endHour <= startHour) {
      return jsonError("Jam booking tidak valid.");
    }

    const supabase = createPublicServerClient();
    const quote = await fetchBookingQuote(supabase, {
      name,
      phone,
      assetId,
      date,
      startHour,
      endHour,
      voucherCode,
    });

    if (!quote.paymentGatewayEnabled) {
      return jsonError(
        "Pembayaran gateway sedang dimatikan. Silakan upload bukti transfer pada form booking.",
        409,
      );
    }

    const midtransOrderId = createMidtransOrderId();
    const bookingData = await reserveBooking(supabase, {
      name,
      phone,
      assetId,
      date,
      startHour,
      endHour,
      voucherCode,
      asset: quote.asset,
      grossAmount: quote.totals.total,
      hourlyRate: quote.totals.rate,
      orderId: midtransOrderId,
    });

    try {
      const midtrans = await createMidtransSnapTransaction({
        orderId: midtransOrderId,
        grossAmount: quote.totals.total,
        customerName: name,
        customerPhone: phone,
      });

      return NextResponse.json({
        snapToken: midtrans.token,
        redirectUrl: midtrans.redirect_url || null,
        orderId: midtransOrderId,
        rentalId: bookingData.rentalId,
        paymentExpiresAt: bookingData.paymentExpiresAt,
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
