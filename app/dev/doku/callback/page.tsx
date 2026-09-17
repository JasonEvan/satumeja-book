import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DOKU Sandbox — Satu Meja",
  robots: { index: false, follow: false },
};

export default function DokuCallbackPage() {
  return (
    <main className="doku-test-page">
      <section className="doku-test-card" aria-labelledby="doku-callback-title">
        <p className="doku-test-badge">DOKU · SANDBOX</p>
        <h1 id="doku-callback-title">Kembali dari DOKU Sandbox</h1>
        <p className="doku-test-intro">
          Halaman ini digunakan oleh tombol kembali ke merchant dari DOKU.
        </p>
        <p className="doku-test-note">
          Status pembayaran tidak dikonfirmasi oleh halaman redirect ini dan
          tidak ada data booking yang diperbarui di database.
        </p>
        <Link className="doku-test-link" href="/dev/doku">
          Kembali ke halaman uji DOKU
        </Link>
      </section>
    </main>
  );
}
