"use client";

import Link from "next/link";
import Image from "next/image";
import { useSyncExternalStore } from "react";

type Confirmation = {
  rentalId: string;
  paymentExpiresAt: string | null;
  booking: {
    customerName: string;
    tableName: string;
    date: string;
    startHour: number;
    endHour: number;
    total: number;
  };
};

const CONFIRMATION_STORAGE_KEY = "static-booking-confirmation";
const ADMIN_WHATSAPP_NUMBER = "6289672094579";
let hasCachedConfirmation = false;
let cachedConfirmationRaw: string | null = null;
let cachedConfirmation: Confirmation | null = null;

function getConfirmationSnapshot() {
  try {
    const raw = window.sessionStorage.getItem(CONFIRMATION_STORAGE_KEY);
    if (hasCachedConfirmation && raw === cachedConfirmationRaw) {
      return cachedConfirmation;
    }

    hasCachedConfirmation = true;
    cachedConfirmationRaw = raw;
    cachedConfirmation = null;

    if (!raw) return cachedConfirmation;

    const parsed = JSON.parse(raw) as Confirmation;
    if (parsed.rentalId && parsed.booking) {
      cachedConfirmation = parsed;
    }
  } catch {
    window.sessionStorage.removeItem(CONFIRMATION_STORAGE_KEY);
  }

  return cachedConfirmation;
}

function formatRupiah(amount: number) {
  return `Rp${Math.round(amount).toLocaleString("id-ID")}`;
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00+07:00`);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export default function BookingConfirmationPage() {
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const confirmation = useSyncExternalStore(
    () => () => {},
    getConfirmationSnapshot,
    () => null,
  );

  if (!isHydrated) {
    return <main className="min-h-screen bg-cream" />;
  }

  if (!confirmation) {
    return (
      <main className="min-h-screen bg-cream px-5 py-16 text-center text-pine">
        <div className="mx-auto max-w-md rounded-3xl border border-gold bg-cream-2 p-8 shadow-sm">
          <h1 className="font-baloo text-2xl font-bold">Data booking tidak ditemukan</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Silakan buat booking terlebih dahulu dari halaman utama.
          </p>
          <Link href="/" className="mt-6 inline-flex rounded-xl bg-pine px-5 py-3 font-bold text-cream-2">
            Kembali ke booking
          </Link>
        </div>
      </main>
    );
  }

  const whatsappMessage = `Hai Satu Meja, saya ingin konfirmasi booking dengan nomer booking ${confirmation.rentalId}, terima kasih`;
  const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;
  const expiryText = confirmation.paymentExpiresAt
    ? new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        day: "numeric",
        month: "long",
      }).format(new Date(confirmation.paymentExpiresAt))
    : null;

  return (
    <main className="min-h-screen bg-cream px-4 py-8 sm:py-12">
      <section className="mx-auto max-w-xl overflow-hidden rounded-[2rem] border-2 border-gold bg-cream-2 shadow-[0_20px_45px_-28px_rgba(27,58,43,0.6)]">
        <div className="bg-pine px-6 py-7 text-center text-cream-2 sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-soft">Booking dibuat</p>
          <h1 className="mt-2 font-baloo text-3xl font-bold">Konfirmasi ke admin</h1>
          <p className="mt-2 text-sm leading-6 text-cream-2/85">
            Silakan konfirmasi booking ke admin dan kirim bukti pembayaran melalui WhatsApp.
          </p>
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-10 sm:py-8">
          <div className="rounded-2xl border border-gold bg-[#fff7dd] p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Nomor booking</p>
            <p className="mt-1 break-all font-mono text-sm font-bold text-pine">{confirmation.rentalId}</p>
            {expiryText ? (
              <p className="mt-2 text-xs leading-5 text-muted">
                Slot ditahan sampai {expiryText} WIB.
              </p>
            ) : null}
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-4 text-center font-bold text-white shadow-sm transition hover:bg-[#1ebe5a]"
          >
            Konfirmasi via WhatsApp
          </a>

          <div className="rounded-2xl border border-[#d8cfa9] bg-white p-4">
            <h2 className="font-baloo text-lg font-bold text-pine">Detail pesanan</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-muted">Nama</dt><dd className="text-right font-semibold text-ink">{confirmation.booking.customerName}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Meja</dt><dd className="text-right font-semibold text-ink">{confirmation.booking.tableName}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Tanggal</dt><dd className="text-right font-semibold text-ink">{formatDate(confirmation.booking.date)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Jam</dt><dd className="text-right font-semibold text-ink">{formatHour(confirmation.booking.startHour)} – {formatHour(confirmation.booking.endHour)} WIB</dd></div>
              <div className="flex justify-between gap-4 border-t border-dashed border-[#d8cfa9] pt-3"><dt className="font-bold text-pine">Total</dt><dd className="font-baloo text-base font-bold text-red">{formatRupiah(confirmation.booking.total)}</dd></div>
            </dl>
          </div>

          <div className="qris-card !mb-0">
            <div className="qris-card__header">
              <div className="qris-card__copy">
                <p className="m-0 font-baloo text-[15px] font-bold text-pine">Scan QRIS untuk Pembayaran</p>
                <p className="m-0 mt-1 text-[11px] text-muted">Setelah membayar, kirim bukti pembayaran ke admin melalui WhatsApp.</p>
              </div>
              <span className="rounded-full bg-pine px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-cream-2">QRIS</span>
            </div>
            <div className="qris-card__image-wrap">
              <Image src="/QRIS.jpeg" alt="Kode QRIS untuk pembayaran booking" width={1127} height={1600} className="qris-card__image" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
