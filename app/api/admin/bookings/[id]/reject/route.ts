import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  return isValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rentals")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("status", "pending_payment")
    .like("midtrans_order_id", "static-%")
    .gt("payment_expired_at", new Date().toISOString())
    .select("id, status")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "Booking tidak ditemukan, sudah diproses, atau masa hold sudah berakhir." },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true, rentalId: data.id, status: data.status });
}
