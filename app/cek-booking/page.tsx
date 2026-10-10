import type { Metadata } from "next";
import Link from "next/link";
import BookingLookup from "./booking-lookup";

export const metadata: Metadata = {
  title: "Cek Booking — Satu Meja",
  robots: { index: false, follow: false },
};

export default function CheckBookingPage() {
  return (
    <main className="lookup-page">
      <div className="lookup-page__shell">
        <Link className="lookup-page__back" href="/">
          ← Kembali ke beranda
        </Link>
        <section className="lookup-card" aria-labelledby="lookup-title">
          <span className="lookup-card__eyebrow">Satu Meja · Reservasi</span>
          <h1 id="lookup-title">Cek Booking</h1>
          <p>Masukkan nomor telepon yang digunakan saat booking untuk melihat jadwal dan status reservasi.</p>
          <BookingLookup />
        </section>
      </div>
    </main>
  );
}
