import Link from "next/link";

type PaymentResultProps = {
  outcome: "success" | "cancel";
  searchParams: Promise<{ invoice_number?: string | string[]; amount?: string | string[] }>;
};

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatAmount(value: string | undefined) {
  const amount = value ? Number(value) : Number.NaN;
  if (!Number.isSafeInteger(amount) || amount < 0) return "Tidak tersedia";
  return `Rp${amount.toLocaleString("id-ID")}`;
}

export default async function DokuProductionPaymentResult({
  outcome,
  searchParams,
}: PaymentResultProps) {
  const query = await searchParams;
  const invoiceNumber = getFirstValue(query.invoice_number);
  const amount = formatAmount(getFirstValue(query.amount));
  const isSuccess = outcome === "success";

  return (
    <main className="doku-test-page">
      <section className="doku-test-card" aria-labelledby="doku-result-title">
        <p className="doku-test-badge">DOKU · PRODUCTION</p>
        <h1 id="doku-result-title">
          {isSuccess ? "Pembayaran selesai" : "Pembayaran dibatalkan"}
        </h1>
        <p className="doku-test-intro">
          {isSuccess
            ? "Anda kembali dari proses pembayaran DOKU."
            : "Anda membatalkan atau belum menyelesaikan proses pembayaran DOKU."}
        </p>
        <dl className="doku-test-details">
          <div><dt>Pesanan</dt><dd>Booking Satu Meja</dd></div>
          <div><dt>Invoice</dt><dd>{invoiceNumber || "Tidak tersedia"}</dd></div>
          <div><dt>Total</dt><dd>{amount}</dd></div>
        </dl>
        <p className="doku-test-note">
          Halaman redirect bukan bukti pembayaran final dan tidak mengubah database.
        </p>
        <Link className="doku-test-link" href="/prod/doku">
          Kembali ke halaman DOKU
        </Link>
      </section>
    </main>
  );
}
