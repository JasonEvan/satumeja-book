import RevenueTransactionsClient from "@/app/dashboard/pendapatan/revenue-transactions-client";
import { requireOwner } from "@/lib/owner-auth";
import { getRevenueTransactions } from "@/lib/revenue-reports";

export const dynamic = "force-dynamic";

export default async function RevenuePage() {
  await requireOwner("/dashboard/pendapatan");
  const transactions = await getRevenueTransactions();
  return <RevenueTransactionsClient transactions={transactions} />;
}
