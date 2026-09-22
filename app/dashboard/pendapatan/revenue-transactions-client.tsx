"use client";

import { useMemo, useState } from "react";

import {
  matchesPeriod,
  ReportPeriodFilter,
  todayWibDateKey,
  type PeriodFilter,
} from "@/app/dashboard/report-period-filter";
import {
  formatRupiah,
  formatWibDateTime,
  type RevenueSource,
  type RevenueTransaction,
} from "@/lib/revenue-reports";
import { downloadRevenueExcel } from "@/lib/revenue-excel";

type SourceFilter = "all" | RevenueSource;
type ExportScope = "visible" | "fnb" | "rental" | "separated";

const filterLabels: Record<SourceFilter, string> = { all: "Semua", fnb: "FnB", rental: "Rental" };

export default function RevenueTransactionsClient({ transactions }: { transactions: RevenueTransaction[] }) {
  const [filter, setFilter] = useState<SourceFilter>("all");
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<PeriodFilter>(() => ({
    mode: "day",
    value: todayWibDateKey(),
  }));
  const [exportScope, setExportScope] = useState<ExportScope>("visible");
  const [isExporting, setIsExporting] = useState(false);
  const periodTransactions = useMemo(
    () => transactions.filter((transaction) => matchesPeriod(transaction, period)),
    [period, transactions],
  );
  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return periodTransactions.filter((transaction) => {
      const matchesSource = filter === "all" || transaction.source === filter;
      const matchesQuery = !normalizedQuery || [transaction.reference, transaction.description, transaction.paymentMethod || ""].some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesSource && matchesQuery;
    });
  }, [filter, periodTransactions, query]);
  const exportTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const searched = periodTransactions.filter((transaction) => !normalizedQuery || [transaction.reference, transaction.description, transaction.paymentMethod || ""].some((value) => value.toLowerCase().includes(normalizedQuery)));
    if (exportScope === "visible") return visible;
    if (exportScope === "fnb") return searched.filter((transaction) => transaction.source === "fnb");
    if (exportScope === "rental") return searched.filter((transaction) => transaction.source === "rental");
    return searched;
  }, [exportScope, periodTransactions, query, visible]);

  const total = visible.reduce((sum, transaction) => sum + transaction.amount, 0);
  const fnbTotal = periodTransactions.filter((item) => item.source === "fnb").reduce((sum, item) => sum + item.amount, 0);
  const rentalTotal = periodTransactions.filter((item) => item.source === "rental").reduce((sum, item) => sum + item.amount, 0);

  async function exportExcel() {
    if (!exportTransactions.length) return;
    setIsExporting(true);
    try {
      await downloadRevenueExcel({
        transactions: exportTransactions,
        scope: exportScope,
        periodLabel: formatExportPeriod(period),
        reportTitle: "Laporan Pendapatan Satu Meja",
        filePrefix: "pendapatan-satu-meja",
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="relative mx-auto w-full max-w-[90rem] px-4 py-7 pb-12 sm:px-7 lg:px-10 lg:py-10 xl:px-12">
      <div className="pointer-events-none absolute top-0 right-0 h-72 w-72 rounded-full bg-gold/[0.06] blur-3xl" aria-hidden="true" />
      <header className="relative mb-8">
        <div className="mb-3 flex items-center gap-2"><span className="h-px w-7 bg-gold"/><p className="text-[11px] font-bold tracking-[0.22em] text-[#98752b] uppercase">Laporan keuangan</p></div>
        <h1 className="font-baloo text-4xl leading-none font-bold tracking-tight text-pine sm:text-5xl">Pendapatan</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Telusuri setiap pemasukan FnB dan rental yang tercatat untuk outlet ini.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard accent="pine" label="Total pendapatan" value={formatRupiah(fnbTotal + rentalTotal)} count={`${periodTransactions.length} transaksi`} />
        <SummaryCard accent="cream" label="Kontribusi FnB" value={formatRupiah(fnbTotal)} count={`${periodTransactions.filter((item) => item.source === "fnb").length} transaksi`} />
        <SummaryCard accent="gold" label="Kontribusi rental" value={formatRupiah(rentalTotal)} count={`${periodTransactions.filter((item) => item.source === "rental").length} rental selesai`} />
      </section>

      <section className="mt-5 overflow-hidden rounded-[1.75rem] border border-[#ded3b1] bg-[#fffdf8] shadow-[0_18px_45px_-35px_rgba(27,58,43,0.45)]">
        <div className="border-b border-[#eee5ce] p-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div><h2 className="font-baloo text-2xl font-bold text-pine">Riwayat transaksi</h2><p className="mt-1 text-xs text-muted">{visible.length} transaksi · {formatRupiah(total)}</p></div>
            <ReportPeriodFilter filter={period} onChange={setPeriod} transactions={transactions} />
          </div>
          <div className="mt-4 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <label className="relative block">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"><SearchIcon /></span>
              <input className="h-10 w-full rounded-xl border border-[#dfd5b9] bg-white pr-4 pl-10 text-xs text-pine outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/10 sm:w-56" onChange={(event) => setQuery(event.target.value)} placeholder="Cari transaksi..." type="search" value={query} />
            </label>
            <div className="grid grid-cols-3 rounded-xl border border-[#e3d9bd] bg-[#f7f1e2] p-1 sm:inline-flex sm:gap-0">
              {(["all", "fnb", "rental"] as SourceFilter[]).map((item) => <button className={`rounded-lg px-2 py-2 text-xs font-bold transition-all sm:px-3.5 ${filter === item ? "bg-pine text-white shadow-sm" : "text-muted hover:text-pine"}`} key={item} onClick={() => setFilter(item)} type="button">{filterLabels[item]}</button>)}
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <select aria-label="Cakupan ekspor Excel" className="h-10 min-w-0 flex-1 rounded-xl border border-[#dfd5b9] bg-white px-3 text-xs font-semibold text-pine outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/10 sm:w-48" onChange={(event) => setExportScope(event.target.value as ExportScope)} value={exportScope}>
                <option value="visible">Sesuai tampilan</option>
                <option value="separated">FnB & rental terpisah</option>
                <option value="fnb">FnB saja</option>
                <option value="rental">Rental saja</option>
              </select>
              <button className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-pine px-3.5 text-xs font-bold text-white transition hover:bg-[#29543b] disabled:cursor-not-allowed disabled:opacity-50" disabled={!exportTransactions.length || isExporting} onClick={exportExcel} type="button"><DownloadIcon />{isExporting ? "Membuat..." : "Excel"}</button>
            </div>
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead><tr className="border-b border-[#eee5ce] bg-[#faf6ec] text-[10px] font-extrabold tracking-[0.12em] text-muted uppercase"><th className="px-7 py-4">Transaksi</th><th className="px-5 py-4">Kategori</th><th className="px-5 py-4">Waktu</th><th className="px-5 py-4">Metode</th><th className="px-7 py-4 text-right">Jumlah</th></tr></thead>
            <tbody className="divide-y divide-[#f0e8d4]">
              {visible.map((transaction) => (
                <tr className="group transition-colors hover:bg-[#fbf8ef]" key={`${transaction.source}-${transaction.id}`}>
                  <td className="px-7 py-4"><div className="flex items-center gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${transaction.source === "fnb" ? "bg-[#e8f0e9] text-pine" : "bg-[#fff0c7] text-[#8b6b24]"}`}><TransactionIcon source={transaction.source}/></span><div><p className="font-bold text-pine">{transaction.description}</p><p className="mt-0.5 font-mono text-[10px] tracking-wide text-muted">#{transaction.reference}</p></div></div></td>
                  <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-extrabold tracking-wide uppercase ${transaction.source === "fnb" ? "bg-[#e8f0e9] text-[#29543b]" : "bg-[#fff0c7] text-[#795b12]"}`}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{transaction.source === "fnb" ? "FnB" : "Rental"}</span></td>
                  <td className="px-5 py-4"><p className="text-xs font-semibold text-pine">{formatWibDateTime(transaction.occurredAt)}</p><p className="mt-1 text-[10px] text-muted">Waktu Indonesia Barat</p></td>
                  <td className="px-5 py-4 text-xs font-medium text-muted">{formatPaymentMethod(transaction.paymentMethod)}</td>
                  <td className="px-7 py-4 text-right font-baloo text-lg font-bold text-pine">{formatRupiah(transaction.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-[#f0e8d4] md:hidden">
          {visible.map((transaction) => (
            <article className="px-5 py-4" key={`${transaction.source}-${transaction.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${transaction.source === "fnb" ? "bg-[#e8f0e9] text-pine" : "bg-[#fff0c7] text-[#8b6b24]"}`}><TransactionIcon source={transaction.source}/></span>
                  <div className="min-w-0"><p className="truncate text-sm font-bold text-pine">{transaction.description}</p><p className="mt-1 truncate font-mono text-[10px] text-muted">#{transaction.reference}</p></div>
                </div>
                <p className="shrink-0 font-baloo text-lg font-bold text-pine">{formatRupiah(transaction.amount)}</p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#f2ecdd] pt-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-extrabold tracking-wide uppercase ${transaction.source === "fnb" ? "bg-[#e8f0e9] text-[#29543b]" : "bg-[#fff0c7] text-[#795b12]"}`}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{transaction.source === "fnb" ? "FnB" : "Rental"}</span>
                <span className="truncate text-right text-[10px] font-medium text-muted">{formatWibDateTime(transaction.occurredAt)} WIB</span>
              </div>
            </article>
          ))}
        </div>
        {!visible.length && <div className="grid min-h-56 place-items-center p-8 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#f2ecdc] text-muted"><SearchIcon /></span><p className="mt-4 font-bold text-pine">Transaksi tidak ditemukan</p><p className="mt-1 text-xs text-muted">Coba ganti filter atau kata pencarian.</p></div></div>}
        {!!visible.length && <div className="flex items-center justify-between gap-3 border-t border-[#eee5ce] bg-[#faf6ec] px-5 py-4 text-[11px] text-muted sm:px-7"><span>Menampilkan {visible.length} transaksi</span><span className="shrink-0 font-bold text-pine">Total · {formatRupiah(total)}</span></div>}
      </section>
    </main>
  );
}

function SummaryCard({ accent, label, value, count }: { accent: "pine" | "cream" | "gold"; label: string; value: string; count: string }) {
  const styles = accent === "pine" ? "border-pine bg-pine text-cream" : accent === "gold" ? "border-[#d4b358] bg-[#e6c976] text-pine" : "border-[#ded3b1] bg-[#fffdf8] text-pine";
  return <article className={`relative overflow-hidden rounded-[1.6rem] border p-5 shadow-[0_16px_40px_-32px_rgba(27,58,43,0.55)] ${styles}`}><div className="absolute -right-8 -bottom-12 h-28 w-28 rounded-full border border-current opacity-[0.08]"/><p className={`text-xs font-semibold ${accent === "pine" ? "text-cream/60" : "text-muted"}`}>{label}</p><p className="mt-3 font-baloo text-3xl leading-none font-bold tracking-tight">{value}</p><p className={`mt-4 border-t pt-3 text-[11px] ${accent === "pine" ? "border-white/10 text-cream/50" : "border-black/[0.08] text-muted"}`}>{count}</p></article>;
}

function formatPaymentMethod(method: string | null) {
  if (!method) return "Tidak tercatat";
  return method.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatExportPeriod(period: PeriodFilter) {
  if (period.mode === "all") return "Semua periode";
  if (period.mode === "day") return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${period.value}T00:00:00+07:00`));
  if (period.mode === "month") return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${period.value}-01T00:00:00+07:00`));
  return period.value;
}

function SearchIcon() { return <svg fill="none" height="17" viewBox="0 0 24 24" width="17"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8"/><path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8"/></svg>; }
function DownloadIcon() { return <svg fill="none" height="16" viewBox="0 0 24 24" width="16"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/></svg>; }
function TransactionIcon({ source }: { source: RevenueSource }) { return source === "fnb" ? <svg fill="none" height="18" viewBox="0 0 24 24" width="18"><path d="M7 3v7M4.5 3v4.5A2.5 2.5 0 0 0 7 10a2.5 2.5 0 0 0 2.5-2.5V3M7 10v11M16.5 13V3c2.2 1.5 3.2 3.5 3 6-.1 1.8-1.3 3.4-3 4Zm0 0v8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/></svg> : <svg fill="none" height="18" viewBox="0 0 24 24" width="18"><rect height="16" rx="4" stroke="currentColor" strokeWidth="1.8" width="16" x="4" y="4"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="9" r="1.3" fill="currentColor"/><circle cx="9" cy="15" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/></svg>; }
