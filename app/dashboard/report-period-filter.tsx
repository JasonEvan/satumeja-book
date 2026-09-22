"use client";

import { REPORT_TIME_ZONE, type RevenueTransaction } from "@/lib/revenue-reports";

export type PeriodFilter =
  | { mode: "all" }
  | { mode: "day"; value: string }
  | { mode: "month"; value: string }
  | { mode: "year"; value: string };

type PeriodMode = PeriodFilter["mode"];

export function wibDateKey(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function todayWibDateKey() {
  return wibDateKey(new Date().toISOString());
}

export function matchesPeriod(transaction: RevenueTransaction, filter: PeriodFilter) {
  if (filter.mode === "all") return true;
  const day = wibDateKey(transaction.occurredAt);
  if (filter.mode === "day") return day === filter.value;
  if (filter.mode === "month") return day.slice(0, 7) === filter.value;
  return day.slice(0, 4) === filter.value;
}

export function ReportPeriodFilter({
  filter,
  onChange,
  transactions,
}: {
  filter: PeriodFilter;
  onChange: (filter: PeriodFilter) => void;
  transactions: RevenueTransaction[];
}) {
  const days = [...new Set(transactions.map((transaction) => wibDateKey(transaction.occurredAt)))].sort().reverse();
  const months = [...new Set(days.map((day) => day.slice(0, 7)))];
  const years = [...new Set(days.map((day) => day.slice(0, 4)))];
  const selectedValue = filter.mode === "all" ? "" : filter.value;

  function changeMode(mode: PeriodMode) {
    if (mode === "all") {
      onChange({ mode });
      return;
    }
    const values = mode === "day" ? days : mode === "month" ? months : years;
    onChange({ mode, value: values[0] || "" });
  }

  function updateValue(value: string) {
    if (filter.mode !== "all") onChange({ mode: filter.mode, value });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="inline-flex w-full rounded-xl border border-[#e3d9bd] bg-[#f7f1e2] p-1 sm:w-auto">
        {(["all", "day", "month", "year"] as PeriodMode[]).map((mode) => (
          <button
            className={`min-w-0 flex-1 rounded-lg px-2 py-2 text-[10px] font-bold transition-all sm:flex-none sm:px-3 ${filter.mode === mode ? "bg-pine text-white shadow-sm" : "text-muted hover:text-pine"}`}
            key={mode}
            onClick={() => changeMode(mode)}
            type="button"
          >
            {{ all: "Semua", day: "Tanggal", month: "Bulan", year: "Tahun" }[mode]}
          </button>
        ))}
      </div>
      {filter.mode !== "all" && (
        <label className="relative block w-full sm:w-auto">
          <span className="sr-only">Pilih {filter.mode === "day" ? "tanggal" : filter.mode === "month" ? "bulan" : "tahun"}</span>
          {filter.mode === "day" ? (
            <input className="h-10 w-full rounded-xl border border-[#dfd5b9] bg-white px-3 text-xs font-semibold text-pine outline-none focus:border-gold focus:ring-4 focus:ring-gold/10 sm:w-40" max={days[0]} onChange={(event) => updateValue(event.target.value)} type="date" value={selectedValue} />
          ) : (
            <select className="h-10 w-full rounded-xl border border-[#dfd5b9] bg-white px-3 text-xs font-semibold text-pine outline-none focus:border-gold focus:ring-4 focus:ring-gold/10 sm:w-40" onChange={(event) => updateValue(event.target.value)} value={selectedValue}>
              {(filter.mode === "month" ? months : years).map((value) => <option key={value} value={value}>{formatPeriodOption(value, filter.mode)}</option>)}
            </select>
          )}
        </label>
      )}
    </div>
  );
}

function formatPeriodOption(value: string, mode: Exclude<PeriodMode, "all" | "day">) {
  if (mode === "year") return value;
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: REPORT_TIME_ZONE }).format(new Date(`${value}-01T00:00:00+07:00`));
}
