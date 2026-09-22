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
  summarizeRentalMenuRevenue,
  type RevenueTransaction,
} from "@/lib/revenue-reports";
import { downloadRevenueExcel } from "@/lib/revenue-excel";

export default function RentalRevenueClient({ rentals }: { rentals: RevenueTransaction[] }) {
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>(() => ({
    mode: "day",
    value: todayWibDateKey(),
  }));
  const [isExporting, setIsExporting] = useState(false);
  const filteredRentals = useMemo(
    () => rentals.filter((rental) => matchesPeriod(rental, period)),
    [period, rentals],
  );
  const filteredMenuRevenue = useMemo(
    () => summarizeRentalMenuRevenue(filteredRentals),
    [filteredRentals],
  );
  const selectedMenu = filteredMenuRevenue.find((menu) => menu.menuItemId === selectedMenuId) || null;
  const selectedRentals = useMemo(() => selectedMenuId ? filteredRentals.filter((rental) => rental.menuItemId === selectedMenuId) : filteredRentals, [filteredRentals, selectedMenuId]);
  const totalRevenue = filteredMenuRevenue.reduce((sum, menu) => sum + menu.revenue, 0);
  const totalBookings = filteredMenuRevenue.reduce((sum, menu) => sum + menu.bookings, 0);
  const maxRevenue = Math.max(...filteredMenuRevenue.map((menu) => menu.revenue), 1);

  function handlePeriodChange(nextPeriod: PeriodFilter) {
    setPeriod(nextPeriod);
    setSelectedMenuId(null);
  }

  async function exportExcel() {
    if (!selectedRentals.length) return;
    setIsExporting(true);
    try {
      await downloadRevenueExcel({
        transactions: selectedRentals,
        scope: "rental",
        periodLabel: formatExportPeriod(period),
        reportTitle: selectedMenu ? `Pendapatan Rental ${selectedMenu.menuItemName}` : "Pendapatan Menu Rental Satu Meja",
        filePrefix: selectedMenu ? `rental-${selectedMenu.menuItemName.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}` : "pendapatan-menu-rental",
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="relative mx-auto w-full max-w-[90rem] px-4 py-7 pb-12 sm:px-7 lg:px-10 lg:py-10 xl:px-12">
      <div className="pointer-events-none absolute top-0 right-0 h-72 w-72 rounded-full bg-gold/[0.06] blur-3xl" aria-hidden="true" />
      <header className="relative mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2"><span className="h-px w-7 bg-gold"/><p className="text-[11px] font-bold tracking-[0.22em] text-[#98752b] uppercase">Laporan rental</p></div>
          <h1 className="font-baloo text-4xl leading-none font-bold tracking-tight text-pine sm:text-5xl">Performa menu rental</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Temukan menu yang paling produktif dari seluruh transaksi rental berbayar.</p>
        </div>
        <div className="self-start rounded-2xl border border-[#ded3b1] bg-white/70 px-4 py-3 text-xs text-muted shadow-[0_12px_30px_-24px_rgba(27,58,43,0.5)] backdrop-blur sm:self-auto"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#66a77e]"/>Transaksi berbayar · WIB</div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard dark label="Total pendapatan rental" value={formatRupiah(totalRevenue)} note="Dari seluruh menu" icon={<WalletIcon/>} />
        <StatCard label="Item rental" value={totalBookings.toLocaleString("id-ID")} note={`${filteredMenuRevenue.length} menu aktif`} icon={<DiceIcon/>} />
        <StatCard gold label="Menu terbaik" value={filteredMenuRevenue[0]?.menuItemName || "—"} note={filteredMenuRevenue[0] ? formatRupiah(filteredMenuRevenue[0].revenue) : "Belum ada data"} icon={<TrophyIcon/>} />
      </section>

      <section className="mt-5 rounded-[1.75rem] border border-[#ded3b1] bg-[#fffdf8] p-5 shadow-[0_18px_45px_-35px_rgba(27,58,43,0.45)] sm:p-7">
        <div className="mb-6 flex flex-col gap-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold tracking-[0.18em] text-[#98752b] uppercase">Peringkat performa</p><h2 className="mt-1 font-baloo text-2xl font-bold text-pine">Pendapatan per menu</h2></div><p className="text-xs text-muted">Klik salah satu menu untuk melihat detail transaksi</p></div><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><ReportPeriodFilter filter={period} onChange={handlePeriodChange} transactions={rentals}/><button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-pine px-4 text-xs font-bold text-white transition hover:bg-[#29543b] disabled:cursor-not-allowed disabled:opacity-50" disabled={!selectedRentals.length || isExporting} onClick={exportExcel} type="button"><DownloadIcon />{isExporting ? "Membuat Excel..." : "Ekspor Excel"}</button></div></div>

        {filteredMenuRevenue.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMenuRevenue.map((menu, index) => {
              const active = selectedMenuId === menu.menuItemId;
              const percentage = Math.round((menu.revenue / maxRevenue) * 100);
              return (
                <button className={`group relative overflow-hidden rounded-[1.4rem] border p-5 text-left transition-all duration-200 ${active ? "-translate-y-1 border-pine bg-pine text-cream shadow-[0_18px_35px_-22px_rgba(27,58,43,0.65)]" : "border-[#e5dcc4] bg-white text-pine hover:-translate-y-1 hover:border-gold/70 hover:shadow-[0_18px_35px_-28px_rgba(27,58,43,0.5)]"}`} key={menu.menuItemId} onClick={() => setSelectedMenuId(active ? null : menu.menuItemId)} type="button">
                  <div className="flex items-start justify-between"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${active ? "bg-white/10 text-gold-soft" : "bg-[#edf2ec] text-pine"}`}><DiceIcon/></span><span className={`font-baloo text-3xl font-bold ${active ? "text-gold-soft" : "text-[#d9cba7]"}`}>{String(index + 1).padStart(2, "0")}</span></div>
                  <h3 className="mt-5 truncate font-baloo text-xl font-bold">{menu.menuItemName}</h3>
                  <p className={`mt-1 text-xs ${active ? "text-cream/50" : "text-muted"}`}>{menu.bookings} item transaksi</p>
                  <p className="mt-4 font-baloo text-2xl font-bold">{formatRupiah(menu.revenue)}</p>
                  <div className={`mt-4 h-1.5 overflow-hidden rounded-full ${active ? "bg-white/10" : "bg-[#eee8d9]"}`}><span className={`block h-full rounded-full ${active ? "bg-gold-soft" : "bg-gold"}`} style={{ width: `${percentage}%` }}/></div>
                  <div className={`mt-2 flex justify-between text-[10px] ${active ? "text-cream/45" : "text-muted"}`}><span>Relatif terhadap tertinggi</span><span>{percentage}%</span></div>
                </button>
              );
            })}
          </div>
        ) : <EmptyRental />}
      </section>

      <section className="mt-5 overflow-hidden rounded-[1.75rem] border border-[#ded3b1] bg-[#fffdf8] shadow-[0_18px_45px_-35px_rgba(27,58,43,0.45)]">
        <div className="flex flex-col gap-3 border-b border-[#eee5ce] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div><p className="text-[10px] font-bold tracking-[0.18em] text-[#98752b] uppercase">Rincian booking</p><h2 className="mt-1 font-baloo text-2xl font-bold text-pine">{selectedMenu ? selectedMenu.menuItemName : "Semua menu rental"}</h2><p className="mt-1 text-xs text-muted">{selectedRentals.length} booking · {formatRupiah(selectedRentals.reduce((sum, rental) => sum + rental.amount, 0))}</p></div>
          {selectedMenuId && <button className="self-start rounded-xl border border-[#ddd2b4] bg-white px-4 py-2.5 text-xs font-bold text-pine transition hover:border-gold" onClick={() => setSelectedMenuId(null)} type="button">Tampilkan semua</button>}
        </div>
        <div className="divide-y divide-[#f0e8d4]">
          {selectedRentals.map((rental) => (
            <article className="flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-[#fbf8ef] sm:flex-row sm:items-center sm:justify-between sm:px-7" key={rental.id}>
              <div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff0c7] text-[#8b6b24]"><DiceIcon/></span><div><p className="font-bold text-pine">{rental.menuItemName}</p><p className="mt-1 text-xs text-muted">{rental.description} · #{rental.reference}</p></div></div>
              <div className="flex items-center justify-between gap-8 pl-14 sm:pl-0"><div className="sm:text-right"><p className="text-xs font-semibold text-pine">{formatWibDateTime(rental.occurredAt)}</p><p className="mt-1 text-[10px] text-muted">WIB · Dibayar</p></div><p className="min-w-28 text-right font-baloo text-lg font-bold text-pine">{formatRupiah(rental.amount)}</p></div>
            </article>
          ))}
          {!selectedRentals.length && <p className="py-14 text-center text-sm text-muted">Tidak ada booking pada menu ini.</p>}
        </div>
      </section>
    </main>
  );
}

function StatCard({ dark = false, gold = false, label, value, note, icon }: { dark?: boolean; gold?: boolean; label: string; value: string; note: string; icon: React.ReactNode }) {
  const style = dark ? "border-pine bg-pine text-cream" : gold ? "border-[#d4b358] bg-[#e6c976] text-pine" : "border-[#ded3b1] bg-[#fffdf8] text-pine";
  return <article className={`relative overflow-hidden rounded-[1.6rem] border p-5 shadow-[0_16px_40px_-32px_rgba(27,58,43,0.55)] ${style}`}><div className="flex items-start justify-between"><div className="min-w-0"><p className={`text-xs font-semibold ${dark ? "text-cream/60" : "text-muted"}`}>{label}</p><p className="mt-3 truncate font-baloo text-3xl leading-none font-bold tracking-tight">{value}</p></div><span className={`ml-3 grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${dark ? "bg-white/10 text-gold-soft" : gold ? "bg-white/25 text-pine" : "bg-[#edf2ec] text-pine"}`}>{icon}</span></div><p className={`mt-5 border-t pt-3 text-[11px] ${dark ? "border-white/10 text-cream/50" : "border-black/[0.08] text-muted"}`}>{note}</p></article>;
}

function EmptyRental() { return <div className="grid min-h-56 place-items-center text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#f2ecdc] text-muted"><DiceIcon/></span><p className="mt-4 font-bold text-pine">Belum ada transaksi rental</p><p className="mt-1 text-xs text-muted">Data performa menu akan tampil di sini.</p></div></div>; }

function formatExportPeriod(period: PeriodFilter) { if (period.mode === "all") return "Semua periode"; if (period.mode === "day") return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${period.value}T00:00:00+07:00`)); if (period.mode === "month") return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${period.value}-01T00:00:00+07:00`)); return period.value; }

function DiceIcon() { return <svg fill="none" height="19" viewBox="0 0 24 24" width="19"><rect height="16" rx="4" stroke="currentColor" strokeWidth="1.8" width="16" x="4" y="4"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="9" r="1.3" fill="currentColor"/><circle cx="9" cy="15" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/></svg>; }
function DownloadIcon() { return <svg fill="none" height="16" viewBox="0 0 24 24" width="16"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/></svg>; }
function WalletIcon() { return <svg fill="none" height="19" viewBox="0 0 24 24" width="19"><path d="M4 7.5h15.5v11H5.8A1.8 1.8 0 0 1 4 16.7V7.5Zm0 0V6.8A1.8 1.8 0 0 1 5.8 5h11.7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/><path d="M16 11h4v4h-4a2 2 0 1 1 0-4Z" stroke="currentColor" strokeWidth="1.8"/></svg>; }
function TrophyIcon() { return <svg fill="none" height="19" viewBox="0 0 24 24" width="19"><path d="M8 4h8v4a4 4 0 0 1-8 0V4ZM12 12v4M8 20h8M10 16h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/><path d="M8 6H5v1a4 4 0 0 0 4 4M16 6h3v1a4 4 0 0 1-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/></svg>; }
