import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DOKU Production — Satu Meja",
  robots: { index: false, follow: false },
};

export default function DokuProductionCallbackPage() {
  return (
    <main className="doku-test-page">
      <section className="doku-test-card" aria-labelledby="doku-callback-title">
        <p className="doku-test-badge">DOKU · PRODUCTION</p>
        <h1 id="doku-callback-title">Kembali dari DOKU</h1>
        <p className="doku-test-intro">
          Halaman ini digunakan oleh tombol kembali ke merchant dari DOKU.
        </p>
        <p className="doku-test-note">
          Status pembayaran tidak dikonfirmasi oleh halaman redirect ini dan
          tidak ada data booking yang diperbarui di database.
        </p>
        <Link className="doku-test-link" href="/prod/doku">
          Kembali ke halaman DOKU
        </Link>
      </section>
    </main>
  );
}
