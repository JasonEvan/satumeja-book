"use client";

import { useState, type FormEvent } from "react";

type BookingResult = {
  assetName: string | null;
  startedAt: string;
  estimatedEndedAt: string | null;
  status: string;
  paymentVerificationStatus: string | null;
};

const statusLabels: Record<string, string> = {
  reserved: "Terkonfirmasi",
  active: "Sedang berlangsung",
  completed: "Selesai",
  pending_payment: "Menunggu pembayaran",
  payment_failed: "Pembayaran gagal",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
  payment_review: "Pembayaran perlu konfirmasi admin",
};

function formatDate(value: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return "—";
  return new Date(value).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }) + " WIB";
}
function labelFor(booking: BookingResult) {
  if (booking.paymentVerificationStatus === "pending_review") return "Menunggu verifikasi pembayaran";
  if (booking.paymentVerificationStatus === "rejected") return "Bukti pembayaran ditolak";
  return statusLabels[booking.status] || "Hubungi admin untuk konfirmasi";
}

export default function BookingLookup() {
  const [phone, setPhone] = useState("");
  const [bookings, setBookings] = useState<BookingResult[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setBookings(null);
    try {
      const response = await fetch("/api/bookings/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Pencarian belum dapat dilakukan.");
      setBookings(result.bookings);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pencarian belum dapat dilakukan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form className="lookup-form" onSubmit={handleSubmit}>
        <label htmlFor="lookup-phone">Nomor telepon</label>
        <div className="lookup-form__row">
          <input
            id="lookup-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="08xxxxxxxxxx"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            maxLength={24}
          />
          <button type="submit" disabled={loading}>{loading ? "Mencari…" : "Cari booking"}</button>
        </div>
        <small>Gunakan nomor yang sama seperti saat membuat reservasi.</small>
      </form>
      <div className="lookup-results" aria-live="polite">
        {error && <p className="lookup-message lookup-message--error" role="alert">{error}</p>}
        {bookings?.length === 0 && (
          <p className="lookup-message">Booking tidak ditemukan untuk nomor ini. Periksa kembali nomor yang dimasukkan atau hubungi admin.</p>
        )}
        {bookings && bookings.length > 0 && (
          <section aria-label="Daftar booking">
            <h2>Booking ditemukan</h2>
            <ul className="lookup-results__list">
              {bookings.map((booking, index) => (
                <li className="lookup-result" key={`${booking.startedAt}-${index}`}>
                  <span className="lookup-result__status">{labelFor(booking)}</span>
                  <h3>{booking.assetName || "Reservasi meja"}</h3>
                  <dl>
                    <div><dt>Mulai</dt><dd>{formatDate(booking.startedAt)}</dd></div>
                    <div><dt>Selesai</dt><dd>{formatDate(booking.estimatedEndedAt)}</dd></div>
                  </dl>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
