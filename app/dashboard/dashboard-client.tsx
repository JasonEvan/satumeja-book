"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  formatRupiah,
  formatWibDateTime,
  REPORT_TIME_ZONE,
  type RevenueTransaction,
} from "@/lib/revenue-reports";

type Granularity = "daily" | "monthly" | "yearly";
type MetricIcon = "wallet" | "food" | "rental" | "receipt";

const dateFormats: Record<Granularity, Intl.DateTimeFormatOptions> = {
  daily: { day: "2-digit", month: "short" },
  monthly: { month: "short", year: "2-digit" },
  yearly: { year: "numeric" },
};

function periodKey(value: string, granularity: Granularity) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    ...(granularity === "daily" ? { day: "2-digit" } : {}),
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value || "";
  return granularity === "yearly"
    ? part("year")
    : granularity === "monthly"
      ? `${part("year")}-${part("month")}`
      : `${part("year")}-${part("month")}-${part("day")}`;
}

function periodLabel(value: string, granularity: Granularity) {
  const date =
    granularity === "yearly"
      ? new Date(`${value}-01-01T00:00:00+07:00`)
      : granularity === "monthly"
        ? new Date(`${value}-01T00:00:00+07:00`)
        : new Date(`${value}T00:00:00+07:00`);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: REPORT_TIME_ZONE,
    ...dateFormats[granularity],
  }).format(date);
}

function compactCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export default function DashboardClient({
  transactions,
}: {
  transactions: RevenueTransaction[];
}) {
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const chartData = useMemo(() => {
    const grouped = new Map<string, { fnb: number; rental: number }>();
    for (const transaction of transactions) {
      const key = periodKey(transaction.occurredAt, granularity);
      const current = grouped.get(key) || { fnb: 0, rental: 0 };
      current[transaction.source] += transaction.amount;
      grouped.set(key, current);
    }
    const data = [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({
        name: periodLabel(key, granularity),
        ...value,
      }));
    const limit =
      granularity === "daily"
        ? 14
        : granularity === "monthly"
          ? 12
          : data.length;
    return data.slice(-limit);
  }, [granularity, transactions]);

  const fnbTransactions = transactions.filter(
    (transaction) => transaction.source === "fnb",
  );
  const rentalTransactions = transactions.filter(
    (transaction) => transaction.source === "rental",
  );
  const fnbRevenue = fnbTransactions.reduce(
    (total, transaction) => total + transaction.amount,
    0,
  );
  const rentalRevenue = rentalTransactions.reduce(
    (total, transaction) => total + transaction.amount,
    0,
  );
  const totalRevenue = fnbRevenue + rentalRevenue;
  const averageTransaction = transactions.length
    ? totalRevenue / transactions.length
    : 0;
  const rentalShare = totalRevenue
    ? Math.round((rentalRevenue / totalRevenue) * 100)
    : 0;

  return (
    <main className="relative mx-auto w-full max-w-[90rem] px-4 py-7 pb-12 sm:px-7 lg:px-10 lg:py-10 xl:px-12">
      <div
        className="pointer-events-none absolute top-0 right-0 h-72 w-72 rounded-full bg-gold/[0.06] blur-3xl"
        aria-hidden="true"
      />

      <header className="relative mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-px w-7 bg-gold" />
            <p className="text-[11px] font-bold tracking-[0.22em] text-[#98752b] uppercase">
              Owner Dashboard
            </p>
          </div>
          <h1 className="font-baloo text-4xl leading-none font-bold tracking-tight text-pine sm:text-5xl">
            Selamat datang kembali.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            Lihat denyut bisnis Satu Meja dari satu tempat—ringkas, aktual, dan
            sudah disesuaikan ke WIB.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start rounded-2xl border border-[#ded3b1] bg-white/70 px-4 py-3 shadow-[0_12px_30px_-24px_rgba(27,58,43,0.5)] backdrop-blur-sm sm:self-auto">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-pine text-gold-soft">
            <StoreIcon />
          </span>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-muted uppercase">
              Outlet aktif
            </p>
            <p className="mt-0.5 text-sm font-bold text-pine">Satu Meja</p>
          </div>
          <span className="ml-2 h-2 w-2 rounded-full bg-[#66a77e] shadow-[0_0_0_4px_rgba(102,167,126,0.12)]" />
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          className="bg-pine text-cream"
          icon="wallet"
          label="Total pendapatan"
          value={formatRupiah(totalRevenue)}
          meta={`${transactions.length} transaksi tercatat`}
        />
        <MetricCard
          icon="food"
          label="Pendapatan FnB"
          value={formatRupiah(fnbRevenue)}
          meta={`${fnbTransactions.length} transaksi`}
        />
        <MetricCard
          icon="rental"
          label="Pendapatan rental"
          value={formatRupiah(rentalRevenue)}
          meta={`${rentalTransactions.length} rental selesai`}
        />
        <MetricCard
          icon="receipt"
          label="Rata-rata transaksi"
          value={formatRupiah(averageTransaction)}
          meta="Dari seluruh transaksi"
        />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(18rem,0.75fr)]">
        <article className="overflow-hidden rounded-[1.75rem] border border-[#ded3b1] bg-[#fffdf8] shadow-[0_18px_45px_-35px_rgba(27,58,43,0.45)]">
          <div className="flex flex-col gap-4 border-b border-[#eee5ce] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#edf2ec] text-pine">
                  <TrendIcon />
                </span>
                <h2 className="font-baloo text-2xl font-bold text-pine">
                  Tren pendapatan
                </h2>
              </div>
              <p className="mt-1 pl-10 text-xs text-muted">
                Perbandingan FnB dan rental pada periode terpilih
              </p>
            </div>
            <div
              className="inline-flex self-start rounded-xl border border-[#e3d9bd] bg-[#f7f1e2] p-1"
              aria-label="Periode grafik"
            >
              {(["daily", "monthly", "yearly"] as Granularity[]).map((item) => (
                <button
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${granularity === item ? "bg-pine text-white shadow-sm" : "text-muted hover:text-pine"}`}
                  key={item}
                  onClick={() => setGranularity(item)}
                  type="button"
                >
                  {
                    { daily: "Harian", monthly: "Bulanan", yearly: "Tahunan" }[
                      item
                    ]
                  }
                </button>
              ))}
            </div>
          </div>
          {chartData.length ? (
            <div className="h-72 px-1 pt-5 pr-3 pb-3 sm:h-[22rem] sm:px-4 sm:pr-6">
              <ResponsiveContainer height="100%" width="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 4, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="fnbFill" x1="0" x2="0" y1="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#1b3a2b"
                        stopOpacity={0.24}
                      />
                      <stop offset="100%" stopColor="#1b3a2b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="rentalFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#c9a24b" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#c9a24b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="#eee6d2"
                    strokeDasharray="4 5"
                    vertical={false}
                  />
                  <XAxis
                    axisLine={false}
                    dataKey="name"
                    fontSize={11}
                    stroke="#79837c"
                    tickLine={false}
                    tickMargin={12}
                  />
                  <YAxis
                    axisLine={false}
                    fontSize={11}
                    stroke="#79837c"
                    tickFormatter={compactCurrency}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1b3a2b",
                      border: 0,
                      borderRadius: 14,
                      boxShadow: "0 18px 40px rgba(27,58,43,.2)",
                      color: "#fbf7ec",
                      fontSize: 12,
                    }}
                    formatter={(value, name) => [
                      formatRupiah(Number(value)),
                      name === "fnb" ? "FnB" : "Rental",
                    ]}
                    labelStyle={{
                      color: "#e6c976",
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  />
                  <Area
                    dataKey="fnb"
                    fill="url(#fnbFill)"
                    name="fnb"
                    stroke="#1b3a2b"
                    strokeWidth={2.5}
                    type="monotone"
                  />
                  <Area
                    dataKey="rental"
                    fill="url(#rentalFill)"
                    name="rental"
                    stroke="#c9a24b"
                    strokeWidth={2.5}
                    type="monotone"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState />
          )}
          <div className="flex items-center gap-5 border-t border-[#eee5ce] px-7 py-4 text-xs font-semibold text-muted">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-pine" />
              FnB
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-gold" />
              Rental
            </span>
            <span className="ml-auto hidden text-[11px] font-normal sm:block">
              Menampilkan {chartData.length} periode terakhir
            </span>
          </div>
        </article>

        <article className="flex min-h-[28rem] flex-col rounded-[1.75rem] bg-[#e6c976] p-6 text-pine shadow-[0_18px_45px_-35px_rgba(27,58,43,0.55)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-extrabold tracking-[0.18em] uppercase opacity-60">
                Komposisi
              </p>
              <h2 className="mt-1 font-baloo text-2xl font-bold">
                Sumber pendapatan
              </h2>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full border border-pine/15 bg-white/20">
              <PieIcon />
            </span>
          </div>
          <div className="my-auto py-8 text-center">
            <div
              className="relative mx-auto grid h-44 w-44 place-items-center rounded-full"
              style={{
                background: `conic-gradient(#1b3a2b 0 ${100 - rentalShare}%, rgba(255,255,255,.6) ${100 - rentalShare}% 100%)`,
              }}
            >
              <div className="grid h-[7.4rem] w-[7.4rem] place-items-center rounded-full bg-[#e6c976] shadow-inner">
                <div>
                  <p className="font-baloo text-4xl leading-none font-bold">
                    {100 - rentalShare}%
                  </p>
                  <p className="mt-1 text-[10px] font-bold tracking-widest uppercase opacity-60">
                    dari FnB
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3 rounded-2xl bg-white/25 p-4 backdrop-blur-sm">
            <CompositionRow color="bg-pine" label="FnB" value={fnbRevenue} />
            <CompositionRow
              color="bg-white/80"
              label="Rental"
              value={rentalRevenue}
            />
          </div>
        </article>
      </section>

      <section className="mt-5 rounded-[1.75rem] border border-[#ded3b1] bg-[#fffdf8] p-5 shadow-[0_18px_45px_-35px_rgba(27,58,43,0.4)] sm:p-7">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] text-[#98752b] uppercase">
              Aktivitas terbaru
            </p>
            <h2 className="mt-1 font-baloo text-2xl font-bold text-pine">
              Transaksi terakhir
            </h2>
          </div>
          <span className="rounded-full bg-[#edf2ec] px-3 py-1.5 text-[11px] font-bold text-pine">
            {transactions.length} total
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {transactions.slice(0, 4).map((transaction) => (
            <article
              className="group rounded-2xl border border-[#e8dfc7] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-[0_12px_30px_-24px_rgba(27,58,43,0.55)]"
              key={`${transaction.source}-${transaction.id}`}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`grid h-9 w-9 place-items-center rounded-xl ${transaction.source === "fnb" ? "bg-[#e8f0e9] text-pine" : "bg-[#fff0c7] text-[#8b6b24]"}`}
                >
                  {transaction.source === "fnb" ? <FoodIcon /> : <RentalIcon />}
                </span>
                <span className="rounded-full bg-[#f4f0e5] px-2.5 py-1 text-[9px] font-extrabold tracking-wider text-muted uppercase">
                  {transaction.source}
                </span>
              </div>
              <p className="mt-4 truncate text-sm font-bold text-pine">
                {transaction.description}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                {formatWibDateTime(transaction.occurredAt)} WIB
              </p>
              <p className="mt-3 font-baloo text-xl font-bold text-pine">
                {formatRupiah(transaction.amount)}
              </p>
            </article>
          ))}
          {!transactions.length && (
            <p className="col-span-full py-8 text-center text-sm text-muted">
              Belum ada transaksi yang dapat ditampilkan.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  className = "bg-[#fffdf8] text-pine",
  icon,
  label,
  value,
  meta,
}: {
  className?: string;
  icon: MetricIcon;
  label: string;
  value: string;
  meta: string;
}) {
  const dark = className.includes("bg-pine");
  return (
    <article
      className={`relative overflow-hidden rounded-[1.6rem] border p-5 shadow-[0_16px_40px_-32px_rgba(27,58,43,0.55)] ${dark ? "border-pine" : "border-[#ded3b1]"} ${className}`}
    >
      <div className="absolute -right-8 -bottom-10 h-28 w-28 rounded-full border border-current opacity-[0.06]" />
      <div className="flex items-start justify-between">
        <div>
          <p
            className={`text-xs font-semibold ${dark ? "text-cream/60" : "text-muted"}`}
          >
            {label}
          </p>
          <p className="mt-3 font-baloo text-[1.7rem] leading-none font-bold tracking-tight sm:text-3xl">
            {value}
          </p>
        </div>
        <span
          className={`grid h-10 w-10 place-items-center rounded-2xl ${dark ? "bg-white/10 text-gold-soft" : "bg-[#edf2ec] text-pine"}`}
        >
          <MetricIconView name={icon} />
        </span>
      </div>
      <div
        className={`mt-5 flex items-center gap-2 border-t pt-3 text-[11px] font-medium ${dark ? "border-white/10 text-cream/50" : "border-[#eee5ce] text-muted"}`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${dark ? "bg-gold-soft" : "bg-gold"}`}
        />
        {meta}
      </div>
    </article>
  );
}

function MetricIconView({ name }: { name: MetricIcon }) {
  if (name === "wallet") return <WalletIcon />;
  if (name === "food") return <FoodIcon />;
  if (name === "rental") return <RentalIcon />;
  return <ReceiptIcon />;
}

function CompositionRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-xs font-bold">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        {label}
      </span>
      <span className="text-xs font-extrabold">{formatRupiah(value)}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[22rem] items-center justify-center text-center text-sm text-muted">
      Belum ada transaksi yang dapat ditampilkan.
    </div>
  );
}

function WalletIcon() {
  return (
    <svg fill="none" height="19" viewBox="0 0 24 24" width="19">
      <path
        d="M4 7.5h15.5v11H5.8A1.8 1.8 0 0 1 4 16.7V7.5Zm0 0V6.8A1.8 1.8 0 0 1 5.8 5h11.7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M16 11h4v4h-4a2 2 0 1 1 0-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}
function FoodIcon() {
  return (
    <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M7 3v7M4.5 3v4.5A2.5 2.5 0 0 0 7 10a2.5 2.5 0 0 0 2.5-2.5V3M7 10v11M16.5 13V3c2.2 1.5 3.2 3.5 3 6-.1 1.8-1.3 3.4-3 4Zm0 0v8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
function RentalIcon() {
  return (
    <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
      <rect
        height="16"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.8"
        width="16"
        x="4"
        y="4"
      />
      <circle cx="9" cy="9" r="1.3" fill="currentColor" />
      <circle cx="15" cy="9" r="1.3" fill="currentColor" />
      <circle cx="9" cy="15" r="1.3" fill="currentColor" />
      <circle cx="15" cy="15" r="1.3" fill="currentColor" />
    </svg>
  );
}
function ReceiptIcon() {
  return (
    <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M9 8h6M9 12h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
function TrendIcon() {
  return (
    <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path
        d="m4 16 5-5 4 3 7-7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M16 7h4v4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
function PieIcon() {
  return (
    <svg fill="none" height="17" viewBox="0 0 24 24" width="17">
      <path
        d="M12 3v9h9A9 9 0 1 1 12 3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M15 3.5A7.5 7.5 0 0 1 20.5 9H15V3.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
function StoreIcon() {
  return (
    <svg fill="none" height="17" viewBox="0 0 24 24" width="17">
      <path
        d="M4 10v10h16V10M3 10l2-6h14l2 6a3 3 0 0 1-5 2 3 3 0 0 1-4 0 3 3 0 0 1-4 0 3 3 0 0 1-5-2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M9 20v-5h6v5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
