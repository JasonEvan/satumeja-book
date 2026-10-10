import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const WINDOW_SECONDS = 10 * 60;

function phoneVariants(value: unknown): string[] | null {
  if (typeof value !== "string" || value.length > 30) return null;
  const cleaned = value.trim().replace(/[\u202a-\u202e]/g, "");
  if (!/^\+?[\d\s().-]+$/.test(cleaned)) return null;
  const digits = cleaned.replace(/\D/g, "");
  const national = digits.startsWith("62") ? `0${digits.slice(2)}` : digits;
  if (!/^08\d{8,12}$/.test(national)) return null;
  const international = `62${national.slice(1)}`;
  // Legacy bookings were saved verbatim, including these formats.
  return [
    ...new Set([
      national,
      international,
      `+${international}`,
      value.trim(),
      cleaned,
      `\u202a${national}\u202c`,
      `${national.slice(0, 4)}-${national.slice(4, 8)}-${national.slice(8)}`,
      `+62 ${national.slice(1, 4)}-${national.slice(4, 8)}-${national.slice(8)}`,
      `+62 ${national.slice(1, 4)} ${national.slice(4, 8)} ${national.slice(8)}`,
    ]),
  ];
}

async function withinLimit(redis: Redis, key: string, max: number) {
  const results = await redis
    .multi()
    .incr(key)
    .expire(key, WINDOW_SECONDS)
    .exec();
  return Number(results[0]) <= max;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Masukkan nomor telepon yang valid." },
      { status: 400, headers: NO_STORE },
    );
  }
  const variants = phoneVariants(
    body && typeof body === "object" && "phone" in body ? body.phone : null,
  );
  if (!variants) {
    return NextResponse.json(
      {
        error:
          "Nomor telepon tidak valid. Gunakan nomor Indonesia 08… atau +628….",
      },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const url =
      process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    if (!url || !token) throw new Error("Rate limiter is not configured");
    const redis = new Redis({ url, token });
    const ip =
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    // Shared Redis counters work across server instances; fail closed if Redis is unavailable.
    const [ipAllowed, phoneAllowed] = await Promise.all([
      withinLimit(
        redis,
        `booking-lookup:ip:${createHash("sha256").update(ip).digest("hex")}`,
        30,
      ),
      withinLimit(
        redis,
        `booking-lookup:phone:${createHash("sha256").update(variants[0]).digest("hex")}`,
        20,
      ),
    ]);
    if (!ipAllowed || !phoneAllowed) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi dalam beberapa menit." },
        { status: 429, headers: NO_STORE },
      );
    }

    const { data, error } = await createAdminClient()
      .from("rentals")
      .select(
        "started_at, estimated_ended_at, status, paid_at, payment_expired_at, payment_verification_status, assets(asset_name)",
      )
      .in("customer_phone", variants)
      .not("midtrans_order_id", "is", null)
      .order("started_at", { ascending: false })
      .limit(20);
    if (error) throw error;

    const bookings = (data || []).map((row) => {
      const assets = row.assets as
        | { asset_name: string | null }
        | { asset_name: string | null }[]
        | null;
      return {
        assetName: Array.isArray(assets)
          ? (assets[0]?.asset_name ?? null)
          : (assets?.asset_name ?? null),
        startedAt: row.started_at,
        estimatedEndedAt: row.estimated_ended_at,
        status:
          row.paid_at &&
          !["reserved", "active", "completed"].includes(row.status)
            ? "payment_review"
            : row.status === "pending_payment" &&
                row.payment_expired_at &&
                Date.parse(row.payment_expired_at) <= Date.now()
              ? "expired"
              : row.status,
        paymentVerificationStatus: row.payment_verification_status,
      };
    });
    return NextResponse.json({ bookings }, { headers: NO_STORE });
  } catch (error) {
    console.error("Booking lookup unavailable", error);
    return NextResponse.json(
      { error: "Pencarian belum tersedia. Silakan coba lagi nanti." },
      { status: 503, headers: NO_STORE },
    );
  }
}
