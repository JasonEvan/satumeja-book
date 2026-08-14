"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";

export interface RateItem {
  minHour: number;
  maxHour: number;
  rate: number;
}

export interface RatesData {
  weekday: RateItem[];
  weekend: RateItem[];
}

export interface TableItem {
  id: number | string;
  label: string;
  name: string;
  outletId?: string;
}

export interface VoucherItem {
  type: "percent" | "flat";
  value: number;
  label: string;
}

const OPEN_HOUR = 10; // 10:00
const CLOSE_HOUR = 23; // 23:00

const HOURS: number[] = [];
for (let h = OPEN_HOUR; h <= CLOSE_HOUR; h++) {
  HOURS.push(h);
}

function fmtHour(h: number) {
  return String(h).padStart(2, "0") + ":00";
}

function formatRp(n: number) {
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

function isWeekend(dateObj: Date) {
  const day = dateObj.getDay(); // 0 Sun, 5 Fri, 6 Sat
  return day === 0 || day === 5 || day === 6;
}

function getRatePerHour(
  totalHours: number,
  dateObj: Date,
  activeRates: RatesData,
) {
  const tiers = isWeekend(dateObj) ? activeRates.weekend : activeRates.weekday;
  for (const tier of tiers) {
    if (totalHours >= tier.minHour && totalHours <= tier.maxHour) {
      return tier.rate;
    }
  }
  return tiers[tiers.length - 1]?.rate || 0;
}

function getTodayWIB() {
  const now = new Date();
  const wib = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );
  const yyyy = wib.getFullYear();
  const mm = String(wib.getMonth() + 1).padStart(2, "0");
  const dd = String(wib.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

interface BookingFormProps {
  initialTables: TableItem[];
  initialRates: RatesData;
  initialVouchers: Record<string, VoucherItem>;
}

export default function BookingForm({
  initialTables,
  initialRates,
  initialVouchers,
}: BookingFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [minDate] = useState(getTodayWIB);
  const [selectedTable, setSelectedTable] = useState<number | string | null>(
    null,
  );
  const [startHour, setStartHour] = useState<number | null>(null);
  const [endHour, setEndHour] = useState<number | null>(null);

  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    type: "percent" | "flat";
    value: number;
    label: string;
  } | null>(null);
  const [voucherMsg, setVoucherMsg] = useState<{
    text: string;
    type: "ok" | "err";
  } | null>(null);

  const [consent, setConsent] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTimeClick = (h: number) => {
    if (startHour === null || (startHour !== null && endHour !== null)) {
      setStartHour(h);
      setEndHour(null);
    } else {
      if (h <= startHour) {
        setStartHour(h);
        setEndHour(null);
      } else {
        setEndHour(h);
      }
    }
  };

  const getTimeHintText = () => {
    if (startHour === null) {
      return "Belum ada jam dipilih.";
    } else if (endHour === null) {
      return `Mulai ${fmtHour(startHour)} — klik jam selesai.`;
    } else {
      return `${fmtHour(startHour)} – ${fmtHour(endHour)} (${
        endHour - startHour
      } jam)`;
    }
  };

  const handleApplyVoucher = () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) {
      setAppliedVoucher(null);
      setVoucherMsg(null);
      return;
    }
    if (initialVouchers[code]) {
      setAppliedVoucher({ code, ...initialVouchers[code] });
      setVoucherMsg({
        text: `Voucher "${code}" diterapkan — ${initialVouchers[code].label}`,
        type: "ok",
      });
    } else {
      setAppliedVoucher(null);
      setVoucherMsg({
        text: "Kode voucher tidak valid.",
        type: "err",
      });
    }
  };

  const dateObj = useMemo(() => {
    return date ? new Date(date + "T00:00:00") : null;
  }, [date]);

  const hasTime = startHour !== null && endHour !== null;
  const totalHours = hasTime ? endHour - startHour : 0;

  const { rate, discount, total } = useMemo(() => {
    let rate = 0;
    let subtotal = 0;
    let discount = 0;
    let total = 0;

    if (totalHours > 0 && dateObj) {
      rate = getRatePerHour(totalHours, dateObj, initialRates);
      subtotal = rate * totalHours;

      if (appliedVoucher) {
        discount =
          appliedVoucher.type === "percent"
            ? subtotal * (appliedVoucher.value / 100)
            : Math.min(appliedVoucher.value, subtotal);
      }
      total = Math.max(subtotal - discount, 0);
    }

    return { rate, discount, total };
  }, [totalHours, dateObj, appliedVoucher, initialRates]);

  const formattedDateStr = dateObj
    ? dateObj.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  const formattedTimeStr = hasTime
    ? `${fmtHour(startHour!)} – ${fmtHour(endHour!)} WIB`
    : "—";

  const isFormValid =
    name.trim() !== "" &&
    phone.trim() !== "" &&
    date !== "" &&
    selectedTable !== null &&
    hasTime &&
    consent;

  // ponytail: execute create_web_booking RPC function on Supabase
  const handleSubmit = async () => {
    if (!isFormValid || !selectedTable || !startHour || !endHour || !dateObj)
      return;

    const selectedItem = initialTables.find(
      (t) => t.id === selectedTable || t.name === selectedTable
    );

    const tableName =
      typeof selectedTable === "string"
        ? selectedTable
        : `Meja ${selectedTable}`;

    const startHourStr = String(startHour).padStart(2, "0");
    const startedAtIso = `${date}T${startHourStr}:00:00+07:00`;
    const durationMinutes = (endHour - startHour) * 60;

    setIsSubmitting(true);
    setBookingError(null);
    setBookingSuccess(null);

    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("create_web_booking", {
        p_outlet_id: selectedItem?.outletId || null,
        p_asset_id: selectedItem?.id || null,
        p_customer_name: name.trim(),
        p_customer_phone: phone.trim(),
        p_started_at: startedAtIso,
        p_duration_minutes: durationMinutes,
        p_hourly_rate: rate,
        p_voucher_code: appliedVoucher?.code || null,
      });

      if (rpcError) {
        setBookingError(rpcError.message || "Gagal membuat booking.");
      } else {
        const detail = `${name.trim()}, ${tableName} · ${formattedDateStr} · ${formattedTimeStr} · Total ${formatRp(
          total,
        )}`;
        setBookingSuccess(detail);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setBookingError(msg);
    } finally {
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getSelectedTableLabel = () => {
    if (!selectedTable) return "—";
    return String(selectedTable);
  };

  return (
    <section aria-label="Form Booking Mahjong">
      {/* Card Form */}
      <div className="bg-cream-2 border-2 border-pine rounded-3xl p-6 relative shadow-[0_10px_0_-4px_rgba(27,58,43,0.08),0_18px_40px_-20px_rgba(27,58,43,0.35)] before:content-[''] before:absolute before:inset-1.5 before:border before:border-dashed before:border-gold before:rounded-[19px] before:pointer-events-none before:opacity-55">
        {bookingSuccess && (
          <div className="bg-pine text-cream-2 rounded-2xl p-4 mb-4 text-[13.5px] leading-normal shadow-sm">
            <b className="font-baloo text-base">Booking terkonfirmasi!</b>
            <br />
            <span>{bookingSuccess}</span>
          </div>
        )}

        {bookingError && (
          <div className="bg-red text-cream-2 rounded-2xl p-4 mb-4 text-[13.5px] leading-normal shadow-sm">
            <b className="font-baloo text-base">Booking Gagal</b>
            <br />
            <span>{bookingError}</span>
          </div>
        )}

        {/* Nama */}
        <div className="mb-4">
          <label
            htmlFor="name"
            className="block font-baloo font-semibold text-[13.5px] text-pine mb-1.5 tracking-wide"
          >
            Nama
          </label>
          <input
            type="text"
            id="name"
            placeholder="Nama lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white border-[1.5px] border-[#d8cfa9] rounded-xl px-3.5 py-2.5 font-inter text-[14px] text-ink outline-none transition-all duration-150 appearance-none focus:border-pine focus:ring-2 focus:ring-pine/15 placeholder:text-[#b9b09a]"
          />
        </div>

        {/* Nomor HP */}
        <div className="mb-4">
          <label
            htmlFor="phone"
            className="block font-baloo font-semibold text-[13.5px] text-pine mb-1.5 tracking-wide"
          >
            Nomor HP
          </label>
          <input
            type="tel"
            id="phone"
            placeholder="08xxxxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-white border-[1.5px] border-[#d8cfa9] rounded-xl px-3.5 py-2.5 font-inter text-[14px] text-ink outline-none transition-all duration-150 appearance-none focus:border-pine focus:ring-2 focus:ring-pine/15 placeholder:text-[#b9b09a]"
          />
        </div>

        {/* Tanggal */}
        <div className="mb-4">
          <label
            htmlFor="date"
            className="block font-baloo font-semibold text-[13.5px] text-pine mb-1.5 tracking-wide"
          >
            Tanggal{" "}
            <span className="font-normal text-muted text-xs ml-1">(WIB)</span>
          </label>
          <input
            type="date"
            id="date"
            min={minDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white border-[1.5px] border-[#d8cfa9] rounded-xl px-3.5 py-2.5 font-inter text-[14px] text-ink outline-none transition-all duration-150 appearance-none focus:border-pine focus:ring-2 focus:ring-pine/15 placeholder:text-[#b9b09a]"
          />
        </div>

        {/* Meja / Asset Grid */}
        <div className="mb-4">
          <label className="block font-baloo font-semibold text-[13.5px] text-pine mb-1.5 tracking-wide">
            Pilih Meja / Unit
          </label>
          <div
            className="grid grid-cols-3 sm:grid-cols-6 gap-2"
            id="tableGrid"
          >
            {initialTables.map((t) => {
              const isActive =
                selectedTable === t.id || selectedTable === t.name;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTable(t.name)}
                  className={`min-h-[44px] rounded-xl border-[1.5px] font-baloo font-bold text-xs sm:text-sm p-2 text-center leading-tight break-words cursor-pointer transition-all duration-150 flex items-center justify-center ${
                    isActive
                      ? "bg-pine border-pine text-cream-2 shadow-[0_3px_0_0_rgba(27,58,43,0.3)]"
                      : "bg-white border-[#d8cfa9] text-pine hover:border-gold"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pilih Jam */}
        <div className="mb-4">
          <label className="block font-baloo font-semibold text-[13.5px] text-pine mb-1.5 tracking-wide">
            Pilih Jam{" "}
            <span className="font-normal text-muted text-xs ml-1">
              (klik jam mulai, lalu jam selesai)
            </span>
          </label>
          <div
            className="grid grid-cols-4 max-[380px]:grid-cols-3 gap-2"
            id="timeGrid"
          >
            {HOURS.map((h) => {
              const isStart = startHour === h;
              const isEnd = endHour === h;
              const inRange =
                startHour !== null &&
                endHour !== null &&
                h > startHour &&
                h < endHour;

              let btnClass =
                "py-2 px-1 rounded-xl border-[1.5px] border-[#d8cfa9] bg-white font-inter font-semibold text-[12.5px] text-ink cursor-pointer transition-all duration-150 text-center hover:border-gold";

              if (isStart || isEnd) {
                btnClass += " !bg-gold !border-gold !text-pine font-bold shadow-xs";
              } else if (inRange) {
                btnClass += " !bg-gold-soft !border-gold";
              }

              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleTimeClick(h)}
                  className={btnClass}
                >
                  {fmtHour(h)}
                </button>
              );
            })}
          </div>
          <div className="text-[11.5px] text-muted mt-1.5" id="timeHint">
            {getTimeHintText()}
          </div>
        </div>

        {/* Kode Voucher */}
        <div className="mb-4">
          <label
            htmlFor="voucher"
            className="block font-baloo font-semibold text-[13.5px] text-pine mb-1.5 tracking-wide"
          >
            Kode Voucher{" "}
            <span className="font-normal text-muted text-xs ml-1">
              (opsional)
            </span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="voucher"
              placeholder="Masukkan kode"
              value={voucherInput}
              onChange={(e) => setVoucherInput(e.target.value)}
              className="flex-1 bg-white border-[1.5px] border-[#d8cfa9] rounded-xl px-3.5 py-2.5 font-inter text-[14px] text-ink outline-none transition-all duration-150 appearance-none focus:border-pine focus:ring-2 focus:ring-pine/15 placeholder:text-[#b9b09a]"
            />
            <button
              type="button"
              id="applyVoucher"
              onClick={handleApplyVoucher}
              className="bg-pine text-cream-2 border-none rounded-xl px-4 py-2.5 font-baloo font-semibold text-[13.5px] cursor-pointer whitespace-nowrap transition-colors duration-150 hover:bg-pine-2 shadow-xs"
            >
              Terapkan
            </button>
          </div>
          <div
            id="voucherMsg"
            className={`text-[12.5px] mt-1.5 min-h-3.5 ${
              voucherMsg?.type === "ok"
                ? "text-pine font-semibold"
                : voucherMsg?.type === "err"
                  ? "text-danger font-semibold"
                  : ""
            }`}
          >
            {voucherMsg?.text || ""}
          </div>
        </div>

        {/* Ribbon */}
        <div className="bg-pine text-cream-2 text-center font-baloo font-bold text-[13px] tracking-wider py-2 px-4 rounded-full mt-5 mb-3.5 shadow-xs">
          RINGKASAN PESANAN
        </div>

        {/* Summary Box */}
        <div className="border-[1.5px] border-dashed border-gold rounded-2xl p-4 bg-[#fffdf5]">
          <div className="flex justify-between items-center text-[13.5px] py-1.5 text-ink">
            <span className="text-muted">Meja</span>
            <span id="sumTable" className="font-semibold text-pine">
              {getSelectedTableLabel()}
            </span>
          </div>
          <div className="flex justify-between items-center text-[13.5px] py-1.5 text-ink">
            <span className="text-muted">Tanggal</span>
            <span id="sumDate" className="font-semibold">
              {formattedDateStr}
            </span>
          </div>
          <div className="flex justify-between items-center text-[13.5px] py-1.5 text-ink">
            <span className="text-muted">Jam</span>
            <span id="sumTime" className="font-semibold">
              {formattedTimeStr}
            </span>
          </div>
          <div className="flex justify-between items-center text-[13.5px] py-1.5 text-ink">
            <span className="text-muted">Total Jam</span>
            <span id="sumHours" className="font-semibold">
              {totalHours ? `${totalHours} jam` : "—"}
            </span>
          </div>
          <div className="border-t border-dashed border-[#d8cfa9] my-2" />
          <div className="flex justify-between items-center text-[13.5px] py-1.5 text-ink">
            <span className="text-muted">Tarif per jam</span>
            <span
              className="bg-pine text-cream-2 font-baloo font-bold text-[13px] px-3 py-1 rounded-full tracking-wide shadow-xs"
              id="sumRate"
            >
              {rate ? `${formatRp(rate)}/jam` : "Rp0"}
            </span>
          </div>
          {discount > 0 && (
            <div
              className="flex justify-between items-center text-[13.5px] py-1.5 text-ink"
              id="discountRow"
            >
              <span className="text-muted">Diskon voucher</span>
              <span
                className="bg-[#3f7452] text-cream-2 font-baloo font-bold text-[13px] px-3 py-1 rounded-full tracking-wide shadow-xs"
                id="sumDiscount"
              >
                -{formatRp(discount)}
              </span>
            </div>
          )}
          <div className="border-t border-dashed border-[#d8cfa9] my-2" />
          <div className="flex justify-between items-center text-[13.5px] py-1.5 text-ink">
            <span className="font-baloo font-bold text-pine text-[15px]">
              Total Harga
            </span>
            <span
              className="bg-red text-cream-2 font-baloo font-bold text-[17px] px-3.5 py-1 rounded-full tracking-wide shadow-xs"
              id="sumTotal"
            >
              {formatRp(total)}
            </span>
          </div>
        </div>

        {/* Consent */}
        <div className="flex items-start gap-2.5 mt-4 mb-2">
          <input
            type="checkbox"
            id="consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-pine shrink-0 cursor-pointer"
          />
          <label
            htmlFor="consent"
            className="text-[12.5px] text-muted leading-normal cursor-pointer"
          >
            Saya menyetujui{" "}
            <b className="text-ink font-bold">syarat &amp; ketentuan</b>{" "}
            booking, termasuk kebijakan pembatalan dan keterlambatan Satu Meja
            Social Mahjong &amp; Game Club.
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          id="submitBtn"
          disabled={!isFormValid || isSubmitting}
          onClick={handleSubmit}
          className="w-full bg-gold text-pine border-none rounded-2xl py-3.5 px-4 font-baloo font-bold text-xl tracking-wide cursor-pointer mt-2 transition-all duration-150 shadow-[0_4px_0_0_#a9843a] hover:enabled:bg-gold-soft active:enabled:translate-y-0.5 active:enabled:shadow-[0_2px_0_0_#a9843a] disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isSubmitting ? "Memproses..." : "Konfirmasi Booking"}
        </button>

        <p className="text-center text-[11.5px] text-muted mt-4">
          Harga mengikuti tarif weekday (Sen–Kam) &amp; weekend/libur nasional
          (Jum–Min) yang berlaku.
        </p>
      </div>
    </section>
  );
}
