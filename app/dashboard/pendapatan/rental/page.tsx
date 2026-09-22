import RentalRevenueClient from "@/app/dashboard/pendapatan/rental/rental-revenue-client";
import { requireOwner } from "@/lib/owner-auth";
import { getRevenueTransactions } from "@/lib/revenue-reports";

export const dynamic = "force-dynamic";

export default async function RentalRevenuePage() {
  await requireOwner("/dashboard/pendapatan/rental");
  const transactions = await getRevenueTransactions();
  return (
    <RentalRevenueClient
      rentals={transactions.filter(
        (transaction) => transaction.source === "rental",
      )}
    />
  );
}
