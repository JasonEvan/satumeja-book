import type { Metadata } from "next";
import DokuProductionPaymentResult from "../payment-result";

export const metadata: Metadata = {
  title: "Pembayaran DOKU Dibatalkan — Satu Meja",
  robots: { index: false, follow: false },
};

type CancelPageProps = {
  searchParams: Promise<{
    invoice_number?: string | string[];
    amount?: string | string[];
  }>;
};

export default function DokuProductionCallbackCancelPage(
  props: CancelPageProps,
) {
  return (
    <DokuProductionPaymentResult
      outcome="cancel"
      searchParams={props.searchParams}
    />
  );
}
