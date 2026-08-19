import { NextResponse } from "next/server";

import {
  fetchBookingQuote,
  normalizeBookingPayload,
  type CreateBookingPayload,
} from "@/lib/booking-request";
import { createPublicServerClient } from "@/utils/supabase/public-server";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateBookingPayload;
    const { assetId, date, startHour, endHour, voucherCode } =
      normalizeBookingPayload(body);

    if (!voucherCode) {
      return jsonError("Masukkan kode voucher.");
    }

    if (!assetId || !date || !Number.isInteger(startHour) || !Number.isInteger(endHour) || endHour <= startHour) {
      return jsonError("Pilih meja, tanggal, serta jam booking terlebih dahulu.");
    }

    const quote = await fetchBookingQuote(createPublicServerClient(), {
      name: "",
      phone: "",
      assetId,
      date,
      startHour,
      endHour,
      voucherCode,
    });

    if (!quote.validatedVoucher) {
      return jsonError("Kode voucher tidak ditemukan atau tidak aktif.");
    }

    return NextResponse.json({ voucher: quote.validatedVoucher });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal memvalidasi voucher.",
    );
  }
}
