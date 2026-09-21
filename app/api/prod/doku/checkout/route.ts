import { NextResponse } from "next/server";
import { createDokuProductionCheckout, DokuApiError } from "@/lib/doku";
import { createDokuProductionTransaction } from "@/lib/doku-production-transactions";

export const runtime = "nodejs";

function getCallbackUrl() {
  const configuredUrl = process.env.DOKU_PRODUCTION_CALLBACK_URL;
  if (!configuredUrl) return undefined;

  try {
    const url = new URL(configuredUrl);
    return url.protocol === "https:" ? url.toString().replace(/\/$/, "") : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const customerName = typeof body.name === "string" ? body.name.trim() : "";
    const customerEmail =
      typeof body.email === "string" ? body.email.trim() : "";
    const customerPhone =
      typeof body.phone === "string" ? body.phone.trim() : "";
    const amount =
      typeof body.amount === "number" ? body.amount : Number(body.amount);

    if (
      !customerName ||
      !customerEmail ||
      !/^\S+@\S+\.\S+$/.test(customerEmail)
    ) {
      return NextResponse.json(
        { error: "Nama dan email yang valid wajib diisi." },
        { status: 400 },
      );
    }
    if (!Number.isInteger(amount) || amount < 1_000 || amount > 999_999_999_999) {
      return NextResponse.json(
        {
          error:
            "Nominal harus berupa angka bulat antara Rp1.000 dan Rp999.999.999.999.",
        },
        { status: 400 },
      );
    }

    const checkout = await createDokuProductionCheckout({
      amount,
      customerName,
      customerEmail,
      customerPhone,
      callbackUrl: getCallbackUrl(),
    });
    await createDokuProductionTransaction({
      invoiceNumber: checkout.invoiceNumber,
      amount,
      expiresAt: checkout.expiresAt,
    });
    return NextResponse.json(checkout);
  } catch (error) {
    if (error instanceof DokuApiError) {
      console.error("DOKU production checkout rejected", {
        dokuStatus: error.status,
        dokuRequestId: error.requestId,
        message: error.message,
      });
      return NextResponse.json(
        { error: `DOKU (${error.status}): ${error.message}` },
        { status: 502 },
      );
    }
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat membuat checkout DOKU.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
