import { redirect } from "next/navigation";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export interface OwnerProfile {
  id: string;
  name: string | null;
  role: string | null;
}

/**
 * Establishes a verified Supabase identity, then authorizes it using the
 * server-side profiles table. Outlet membership is intentionally not checked
 * here: this dashboard currently targets one fixed outlet in its report query.
 */
export async function requireOwner(loginRedirect = "/dashboard"): Promise<OwnerProfile> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;

  if (error || typeof userId !== "string") {
    redirect(`/login?next=${encodeURIComponent(loginRedirect)}`);
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, name, role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || profile?.role?.trim().toLowerCase() !== "owner") {
    redirect("/akses-ditolak");
  }

  return profile as OwnerProfile;
}
