import { Redis } from "@upstash/redis";

const TRANSACTION_KEY_PREFIX = "doku:prod:transaction:";
const TRANSACTION_TTL_SECONDS = 60 * 60 * 24;

export type DokuProductionTransaction = {
  invoiceNumber: string;
  amount: number;
  orderName: string;
  status: string;
  channel: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  webhookReceivedAt: string | null;
  dokuRequestId: string | null;
  createdAt: string;
  updatedAt: string;
};

let redis: Redis | undefined;

function getRedis() {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Upstash Redis belum dikonfigurasi. Tambahkan UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN ke environment Vercel.",
    );
  }

  redis = new Redis({ url, token });
  return redis;
}

function getTransactionKey(invoiceNumber: string) {
  return `${TRANSACTION_KEY_PREFIX}${invoiceNumber}`;
}

export async function createDokuProductionTransaction(input: {
  invoiceNumber: string;
  amount: number;
  expiresAt: string | null;
}) {
  const now = new Date().toISOString();
  const transaction: DokuProductionTransaction = {
    invoiceNumber: input.invoiceNumber,
    amount: input.amount,
    orderName: "Booking Satu Meja",
    status: "PENDING",
    channel: null,
    expiresAt: input.expiresAt,
    paidAt: null,
    webhookReceivedAt: null,
    dokuRequestId: null,
    createdAt: now,
    updatedAt: now,
  };

  await getRedis().set(getTransactionKey(input.invoiceNumber), transaction, {
    ex: TRANSACTION_TTL_SECONDS,
  });

  return transaction;
}

export async function getDokuProductionTransaction(invoiceNumber: string) {
  return getRedis().get<DokuProductionTransaction>(getTransactionKey(invoiceNumber));
}

export async function updateDokuProductionTransactionFromWebhook(input: {
  invoiceNumber: string;
  status: string;
  channel: string | null;
  paidAt: string | null;
  dokuRequestId: string;
}) {
  const current = await getDokuProductionTransaction(input.invoiceNumber);
  if (!current) return null;
  if (current.status === "SUCCESS" && input.status !== "SUCCESS") {
    return current;
  }

  const now = new Date().toISOString();
  const transaction: DokuProductionTransaction = {
    ...current,
    status: input.status,
    channel: input.channel,
    paidAt: input.paidAt || current.paidAt,
    webhookReceivedAt: now,
    dokuRequestId: input.dokuRequestId,
    updatedAt: now,
  };

  await getRedis().set(getTransactionKey(input.invoiceNumber), transaction, {
    ex: TRANSACTION_TTL_SECONDS,
  });

  return transaction;
}
