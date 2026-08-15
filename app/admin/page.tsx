import { cookies } from "next/headers";

import AdminPageClient from "@/app/admin/admin-page-client";
import {
  ADMIN_SESSION_COOKIE,
  hasAdminPasswordConfigured,
  isValidAdminSession,
} from "@/lib/admin-auth";
import { getStoreSettings } from "@/lib/booking-service";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const authenticated = isValidAdminSession(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  const settings = authenticated ? await getStoreSettings() : null;

  return (
    <AdminPageClient
      authenticated={authenticated}
      initialPaymentGatewayEnabled={settings?.paymentGatewayEnabled ?? true}
      hasAdminPasswordConfigured={hasAdminPasswordConfigured()}
    />
  );
}
