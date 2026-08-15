import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { DEFAULT_PAYMENT_GATEWAY_ENABLED } from "@/lib/payment-settings";
import { createAdminClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return isValidAdminSession(session);
}

async function getPrimaryStoreSettings(admin = createAdminClient()) {
  const preferred = await admin
    .from("store_settings")
    .select("outlet_id, store_name, payment_gateway_enabled")
    .ilike("store_name", "%Satu Meja%")
    .limit(1)
    .maybeSingle();

  if (preferred.data) {
    return preferred.data;
  }

  const fallback = await admin
    .from("store_settings")
    .select("outlet_id, store_name, payment_gateway_enabled")
    .limit(1)
    .maybeSingle();

  return fallback.data;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return unauthorized();
  }

  const admin = createAdminClient();
  const current = await getPrimaryStoreSettings(admin);

  return NextResponse.json({
    paymentGatewayEnabled:
      current?.payment_gateway_enabled ?? DEFAULT_PAYMENT_GATEWAY_ENABLED,
  });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return unauthorized();
  }

  const body = (await request.json().catch(() => null)) as
    | { paymentGatewayEnabled?: unknown }
    | null;

  if (typeof body?.paymentGatewayEnabled !== "boolean") {
    return NextResponse.json(
      { error: "paymentGatewayEnabled harus boolean." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const current = await getPrimaryStoreSettings(admin);

  if (!current) {
    return NextResponse.json(
      { error: "store_settings belum tersedia." },
      { status: 404 },
    );
  }

  let updateQuery = admin
    .from("store_settings")
    .update({ payment_gateway_enabled: body.paymentGatewayEnabled });

  if (current.outlet_id) {
    updateQuery = updateQuery.eq("outlet_id", current.outlet_id);
  } else if (current.store_name) {
    updateQuery = updateQuery.eq("store_name", current.store_name);
  } else {
    return NextResponse.json(
      { error: "store_settings tidak punya identifier yang bisa diupdate." },
      { status: 500 },
    );
  }

  const { error } = await updateQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    paymentGatewayEnabled: body.paymentGatewayEnabled,
  });
}
