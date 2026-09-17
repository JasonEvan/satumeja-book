import type { Metadata } from "next";
import DokuTestBooking from "./test-booking";

export const metadata: Metadata = {
  title: "DOKU Sandbox — Satu Meja",
  robots: { index: false, follow: false },
};

export default function DokuSandboxPage() {
  return <DokuTestBooking />;
}
