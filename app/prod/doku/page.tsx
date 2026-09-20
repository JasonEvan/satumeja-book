import type { Metadata } from "next";
import DokuProductionBooking from "./production-booking";

export const metadata: Metadata = {
  title: "DOKU Production — Satu Meja",
  robots: { index: false, follow: false },
};

export default function DokuProductionPage() {
  return <DokuProductionBooking />;
}
