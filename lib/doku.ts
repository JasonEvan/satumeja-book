import crypto from "node:crypto";

const DOKU_SANDBOX_API_URL = "https://api-sandbox.doku.com";
const DOKU_CHECKOUT_PATH = "/checkout/v1/payment";

type DokuCheckoutInput = {
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  callbackUrl?: string;
};

export class DokuApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId: string,
  ) {
    super(message);
  }
}

function getDokuCredentials() {
  const clientId = process.env.DOKU_SANDBOX_CLIENT_ID;
  const secretKey = process.env.DOKU_SANDBOX_SECRET_KEY;
  if (!clientId || !secretKey)
    throw new Error(
      "DOKU sandbox belum dikonfigurasi. Tambahkan DOKU_SANDBOX_CLIENT_ID dan DOKU_SANDBOX_SECRET_KEY ke .env.",
    );
  return { clientId, secretKey };
}

function createDokuSignature(input: {
  clientId: string;
  secretKey: string;
  requestId: string;
  requestTimestamp: string;
  requestTarget: string;
  body: string;
}) {
  const digest = crypto
    .createHash("sha256")
    .update(input.body)
    .digest("base64");
  const component = [
    `Client-Id:${input.clientId}`,
    `Request-Id:${input.requestId}`,
    `Request-Timestamp:${input.requestTimestamp}`,
    `Request-Target:${input.requestTarget}`,
    `Digest:${digest}`,
  ].join("\n");
  return `HMACSHA256=${crypto.createHmac("sha256", input.secretKey).update(component).digest("base64")}`;
}

export function verifyDokuSandboxSignature(input: {
  clientId: string;
  requestId: string;
  requestTimestamp: string;
  requestTarget: string;
  body: string;
  signature: string;
}) {
  const expectedClientId = process.env.DOKU_SANDBOX_CLIENT_ID;
  const secretKey = process.env.DOKU_SANDBOX_SECRET_KEY;

  if (!expectedClientId || !secretKey || input.clientId !== expectedClientId) {
    return false;
  }

  const expected = createDokuSignature({
    clientId: input.clientId,
    secretKey,
    requestId: input.requestId,
    requestTimestamp: input.requestTimestamp,
    requestTarget: input.requestTarget,
    body: input.body,
  });
  const actualBuffer = Buffer.from(input.signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function createCallbackUrl(
  callbackUrl: string,
  invoiceNumber: string,
  amount: number,
  result?: "success" | "cancel",
) {
  const url = new URL(callbackUrl);

  if (result) {
    url.pathname = `${url.pathname.replace(/\/$/, "")}/${result}`;
  }

  url.searchParams.set("invoice_number", invoiceNumber);
  url.searchParams.set("amount", String(amount));

  return url.toString();
}

export async function createDokuSandboxCheckout(input: DokuCheckoutInput) {
  const { clientId, secretKey } = getDokuCredentials();
  const invoiceNumber = `DOKUDEV${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const phone = input.customerPhone?.replace(/\D/g, "");
  const payload = {
    order: {
      amount: input.amount,
      invoice_number: invoiceNumber,
      currency: "IDR",
      auto_redirect: true,
      ...(input.callbackUrl
        ? {
            callback_url: createCallbackUrl(
              input.callbackUrl,
              invoiceNumber,
              input.amount,
            ),
            callback_url_cancel: createCallbackUrl(
              input.callbackUrl,
              invoiceNumber,
              input.amount,
              "cancel",
            ),
            callback_url_result: createCallbackUrl(
              input.callbackUrl,
              invoiceNumber,
              input.amount,
            ),
          }
        : {}),
      line_items: [
        {
          id: "doku-sandbox-booking",
          name: "Booking test Satu Meja",
          quantity: 1,
          price: input.amount,
        },
      ],
    },
    payment: {
      payment_due_date: 30,
    },
    customer: {
      name: input.customerName,
      email: input.customerEmail,
      ...(phone ? { phone } : {}),
    },
  };
  const body = JSON.stringify(payload);
  const requestId = crypto.randomUUID();
  const requestTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const signature = createDokuSignature({
    clientId,
    secretKey,
    requestId,
    requestTimestamp,
    requestTarget: DOKU_CHECKOUT_PATH,
    body,
  });
  const response = await fetch(`${DOKU_SANDBOX_API_URL}${DOKU_CHECKOUT_PATH}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Client-Id": clientId,
      "Request-Id": requestId,
      "Request-Timestamp": requestTimestamp,
      Signature: signature,
    },
    body,
  });
  const rawResponse = await response.text();
  const result = (() => {
    try {
      return JSON.parse(rawResponse) as {
        message?: string[];
        error_messages?: string[];
        error?: { message?: string };
        errors?: { message?: string };
        responseMessage?: string;
        response?: { payment?: { url?: string; expired_date?: string } };
      };
    } catch {
      return null;
    }
  })();
  const payment = result?.response?.payment;
  if (!response.ok || !payment?.url) {
    throw new DokuApiError(
      result?.error_messages?.join(" ") ||
        result?.message?.join(" ") ||
        result?.error?.message ||
        result?.errors?.message ||
        result?.responseMessage ||
        rawResponse.slice(0, 1_000) ||
        "DOKU gagal membuat sesi pembayaran.",
      response.status,
      requestId,
    );
  }
  return {
    checkoutUrl: payment.url,
    invoiceNumber,
    expiresAt: payment.expired_date ?? null,
  };
}
