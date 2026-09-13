import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import {
  fetchBookingQuote,
  normalizeBookingPayload,
  reserveBooking,
  type CreateBookingPayload,
} from "@/lib/booking-request";
import { isPastBookingStart } from "@/lib/booking-time";
import { createPublicServerClient } from "@/utils/supabase/public-server";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateBookingPayload;
    const payload = normalizeBookingPayload(body);

    if (!payload.name || !payload.phone || !payload.assetId || !payload.date) {
      return jsonError("Data booking belum lengkap.");
    }

    if (
      !Number.isInteger(payload.startHour) ||
      !Number.isInteger(payload.endHour) ||
      payload.endHour <= payload.startHour
    ) {
      return jsonError("Jam booking tidak valid.");
    }

    if (isPastBookingStart(payload.date, payload.startHour)) {
      return jsonError("Jam booking sudah lewat. Silakan pilih jam lain.");
    }

    const supabase = createPublicServerClient();
    const quote = await fetchBookingQuote(supabase, payload);

    if (quote.paymentGatewayEnabled) {
      return jsonError("Payment gateway sedang aktif. Gunakan pembayaran Midtrans.", 409);
    }

    const orderId = `static-${randomUUID().replace(/-/g, "").slice(0, 24)}`;
    const reservation = await reserveBooking(supabase, {
      ...payload,
      asset: quote.asset,
      grossAmount: quote.totals.total,
      hourlyRate: quote.totals.rate,
      orderId,
    });

    return NextResponse.json({
      ok: true,
      rentalId: reservation.rentalId,
      paymentExpiresAt: reservation.paymentExpiresAt,
      booking: {
        customerName: payload.name,
        tableName: quote.asset.asset_name,
        date: payload.date,
        startHour: payload.startHour,
        endHour: payload.endHour,
        total: quote.totals.total,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan pada server.";
    return jsonError(message, 500);
  }
}
