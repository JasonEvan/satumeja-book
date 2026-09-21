import type { Metadata } from "next";
import DokuProductionPaymentStatus from "./payment-status";

export const metadata: Metadata = {
  title: "DOKU Production — Satu Meja",
  robots: { index: false, follow: false },
};

export default async function DokuProductionCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ invoice_number?: string | string[] }>;
}) {
  const query = await searchParams;
  const invoiceNumber = Array.isArray(query.invoice_number)
    ? query.invoice_number[0]
    : query.invoice_number;

  return <DokuProductionPaymentStatus invoiceNumber={invoiceNumber || null} />;
}
