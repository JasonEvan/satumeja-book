import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionValue,
  hasAdminPasswordConfigured,
  validateAdminPassword,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { password?: unknown }
    | null;
  const password = typeof body?.password === "string" ? body.password : "";

  if (!hasAdminPasswordConfigured()) {
    return NextResponse.json(
      { error: "ADMIN_ACCESS_PASSWORD belum dikonfigurasi." },
      { status: 500 },
    );
  }

  if (!validateAdminPassword(password)) {
    return NextResponse.json(
      { error: "Password admin tidak valid." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: createAdminSessionValue(),
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
