import crypto from "node:crypto";

const MIDTRANS_SANDBOX_BASE_URL = "https://app.sandbox.midtrans.com";
const MIDTRANS_PRODUCTION_BASE_URL = "https://app.midtrans.com";

function getMidtransBaseUrl() {
  return process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? MIDTRANS_PRODUCTION_BASE_URL
    : MIDTRANS_SANDBOX_BASE_URL;
}

function getMidtransApiAuthHeader() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY is not configured.");
  }

  return `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;
}

export function createMidtransOrderId() {
  return `booking-${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
}

export function verifyMidtransSignature(payload: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  if (!serverKey) {
    return false;
  }

  const expected = crypto
    .createHash("sha512")
    .update(
      `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`,
    )
    .digest("hex");

  return expected === payload.signature_key;
}

export async function createMidtransSnapTransaction(input: {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerPhone: string;
}) {
  const response = await fetch(`${getMidtransBaseUrl()}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: getMidtransApiAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: input.orderId,
        gross_amount: input.grossAmount,
      },
      customer_details: {
        first_name: input.customerName,
        phone: input.customerPhone,
      },
      credit_card: {
        secure: true,
      },
      expiry: {
        unit: "minute",
        duration: 15,
      },
    }),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.token) {
    throw new Error(
      result?.error_messages?.[0] ||
        result?.status_message ||
        "Failed to create Midtrans transaction.",
    );
  }

  return result as { token: string; redirect_url?: string };
}
