import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import RevenueTransactionsClient from "@/app/dashboard/pendapatan/revenue-transactions-client";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { getRevenueTransactions } from "@/lib/revenue-reports";

export const dynamic = "force-dynamic";

export default async function RevenuePage() {
  const cookieStore = await cookies();
  if (!isValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/admin");
  }

  const transactions = await getRevenueTransactions();
  return <RevenueTransactionsClient transactions={transactions} />;
}
