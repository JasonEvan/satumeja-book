import { NextResponse } from "next/server";

import { getDokuProductionTransaction } from "@/lib/doku-production-transactions";

export const runtime = "nodejs";

function response(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...init?.headers },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ invoiceNumber: string }> },
) {
  const { invoiceNumber } = await params;
  if (!/^DOKUPROD[a-f0-9]{20}$/i.test(invoiceNumber)) {
    return response({ error: "Invoice tidak valid." }, { status: 400 });
  }

  try {
    const transaction = await getDokuProductionTransaction(invoiceNumber);
    if (!transaction) {
      return response({ error: "Transaksi tidak ditemukan atau sudah kedaluwarsa." }, { status: 404 });
    }

    return response(transaction);
  } catch (error) {
    console.error("DOKU production transaction lookup failed", error);
    return response({ error: "Status transaksi belum dapat diperiksa." }, { status: 503 });
  }
}
