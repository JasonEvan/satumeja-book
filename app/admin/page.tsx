import { cookies } from "next/headers";

import AdminPageClient from "@/app/admin/admin-page-client";
import {
  ADMIN_SESSION_COOKIE,
  hasAdminPasswordConfigured,
  isValidAdminSession,
} from "@/lib/admin-auth";
import { getAdminBookings } from "@/lib/admin-bookings";
import { getStoreSettings } from "@/lib/booking-service";
import { getEventAds } from "@/lib/event-ads";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const authenticated = isValidAdminSession(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  const [settings, bookings, ads] = authenticated
    ? await Promise.all([getStoreSettings(), getAdminBookings(), getEventAds({ includeExpired: true })])
    : [null, [], []];

  return (
    <AdminPageClient
      authenticated={authenticated}
      initialPaymentGatewayEnabled={settings?.paymentGatewayEnabled ?? true}
      hasAdminPasswordConfigured={hasAdminPasswordConfigured()}
      bookings={bookings}
      initialAds={ads}
    />
  );
}
