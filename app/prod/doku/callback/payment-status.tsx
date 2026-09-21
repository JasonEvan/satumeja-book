"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Transaction = {
  invoiceNumber: string;
  amount: number;
  orderName: string;
  status: string;
  channel: string | null;
  expiresAt: string | null;
  paidAt: string | null;
};

const TERMINAL_STATUSES = new Set([
  "SUCCESS",
  "FAILED",
  "EXPIRED",
  "CANCELLED",
  "CANCEL",
]);

function formatAmount(amount: number) {
  return `Rp${amount.toLocaleString("id-ID")}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function getStatusLabel(status: string) {
  if (status === "SUCCESS") return "Pembayaran berhasil";
  if (TERMINAL_STATUSES.has(status)) return "Pembayaran tidak berhasil";
  return "Menunggu konfirmasi pembayaran";
}

export default function DokuProductionPaymentStatus({
  invoiceNumber,
}: {
  invoiceNumber: string | null;
}) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    if (!invoiceNumber) return;
    setError("");
    try {
      const result = await fetch(
        `/api/prod/doku/transactions/${encodeURIComponent(invoiceNumber)}`,
        { cache: "no-store" },
      );
      const payload = (await result.json()) as Transaction & { error?: string };
      if (!result.ok)
        throw new Error(
          payload.error || "Status transaksi tidak dapat diperiksa.",
        );
      setTransaction(payload);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Status transaksi tidak dapat diperiksa.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [invoiceNumber]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadStatus(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadStatus]);

  useEffect(() => {
    if (!transaction || TERMINAL_STATUSES.has(transaction.status)) return;
    const interval = window.setInterval(() => void loadStatus(), 4_000);
    return () => window.clearInterval(interval);
  }, [loadStatus, transaction]);

  if (!invoiceNumber) {
    return (
      <main className="doku-test-page">
        <section className="doku-test-card" aria-labelledby="doku-result-title">
          <p className="doku-test-badge">DOKU · PRODUCTION</p>
          <h1 id="doku-result-title">Transaksi tidak ditemukan</h1>
          <p className="doku-test-error" role="alert">
            Nomor invoice tidak ditemukan pada URL callback.
          </p>
          <Link className="doku-test-link" href="/prod/doku">
            Kembali ke halaman DOKU
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="doku-test-page">
      <section className="doku-test-card" aria-labelledby="doku-result-title">
        <p className="doku-test-badge">DOKU · PRODUCTION</p>
        <h1 id="doku-result-title">
          {transaction
            ? getStatusLabel(transaction.status)
            : "Memverifikasi pembayaran"}
        </h1>
        <p className="doku-test-intro">
          Status di halaman ini diperbarui dari notifikasi pembayaran DOKU.
        </p>
        {transaction && (
          <dl className="doku-test-details">
            <div>
              <dt>Pesanan</dt>
              <dd>{transaction.orderName}</dd>
            </div>
            <div>
              <dt>Invoice</dt>
              <dd>{transaction.invoiceNumber}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{formatAmount(transaction.amount)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{transaction.status}</dd>
            </div>
            <div>
              <dt>Metode</dt>
              <dd>{transaction.channel || "—"}</dd>
            </div>
            <div>
              <dt>Waktu bayar</dt>
              <dd>{formatDate(transaction.paidAt)}</dd>
            </div>
          </dl>
        )}
        {isLoading && !transaction && (
          <p className="doku-test-note">Mengambil detail transaksi…</p>
        )}
        {error && (
          <p className="doku-test-error" role="alert">
            {error}
          </p>
        )}
        {!transaction || !TERMINAL_STATUSES.has(transaction.status) ? (
          <button
            className="doku-status-button"
            type="button"
            onClick={() => void loadStatus()}
          >
            Cek status lagi
          </button>
        ) : null}
        <Link className="doku-test-link" href="/prod/doku">
          Kembali ke halaman DOKU
        </Link>
      </section>
    </main>
  );
}
