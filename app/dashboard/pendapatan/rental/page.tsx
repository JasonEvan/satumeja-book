import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import RentalRevenueClient from "@/app/dashboard/pendapatan/rental/rental-revenue-client";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import {
  getRevenueTransactions,
  summarizeRentalMenuRevenue,
} from "@/lib/revenue-reports";

export const dynamic = "force-dynamic";

export default async function RentalRevenuePage() {
  const cookieStore = await cookies();
  if (!isValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/admin");
  }

  const transactions = await getRevenueTransactions();
  return (
    <RentalRevenueClient
      menuRevenue={summarizeRentalMenuRevenue(transactions)}
      rentals={transactions.filter(
        (transaction) => transaction.source === "rental",
      )}
    />
  );
}
