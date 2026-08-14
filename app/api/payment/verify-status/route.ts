import { NextResponse } from "next/server";

import { createPublicServerClient } from "@/utils/supabase/public-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }

  const supabase = createPublicServerClient();
  const { data, error } = await supabase
    .from("rentals")
    .select(
      "id, status, midtrans_order_id, payment_expired_at, started_at, estimated_ended_at",
    )
    .eq("midtrans_order_id", orderId)
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Booking payment not found." }, { status: 404 });
  }

  return NextResponse.json({
    rentalId: data.id,
    status: data.status,
    orderId: data.midtrans_order_id,
    paymentExpiresAt: data.payment_expired_at,
    startedAt: data.started_at,
    estimatedEndedAt: data.estimated_ended_at,
  });
}
