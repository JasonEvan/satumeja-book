import DashboardClient from "@/app/dashboard/dashboard-client";
import { requireOwner } from "@/lib/owner-auth";
import { getRevenueTransactions } from "@/lib/revenue-reports";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireOwner("/dashboard");
  const transactions = await getRevenueTransactions();
  return <DashboardClient transactions={transactions} />;
}
