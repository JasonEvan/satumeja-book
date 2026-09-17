import type { Metadata } from "next";
import DokuPaymentResult from "../payment-result";

export const metadata: Metadata = {
  title: "Pembayaran DOKU Sandbox Dibatalkan — Satu Meja",
  robots: { index: false, follow: false },
};

type CancelPageProps = {
  searchParams: Promise<{ invoice_number?: string | string[]; amount?: string | string[] }>;
};

export default function DokuCallbackCancelPage(props: CancelPageProps) {
  return <DokuPaymentResult outcome="cancel" searchParams={props.searchParams} />;
}
