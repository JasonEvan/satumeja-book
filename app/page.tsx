"use client";

import { useState, useEffect, useMemo } from "react";

// Config: price list from poster
const RATES = {
  weekday: [
    { minHour: 1, maxHour: 1, rate: 45000 },
    { minHour: 2, maxHour: 2, rate: 40000 },
    { minHour: 3, maxHour: Infinity, rate: 35000 },
  ],
  weekend: [
    { minHour: 1, maxHour: 1, rate: 55000 },
    { minHour: 2, maxHour: 2, rate: 50000 },
    { minHour: 3, maxHour: Infinity, rate: 45000 },
  ],
};

const OPEN_HOUR = 10; // 10:00
const CLOSE_HOUR = 23; // 23:00
const TABLES = [1, 2, 3, 4, 5, 6];

const VOUCHERS: Record<
  string,
  { type: "percent" | "flat"; value: number; label: string }
> = {
  SATUMEJA10: { type: "percent", value: 10, label: "10% off" },
  MAHJONG20K: { type: "flat", value: 20000, label: "Rp20.000 off" },
};

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

function getRatePerHour(totalHours: number, dateObj: Date) {
  const tiers = isWeekend(dateObj) ? RATES.weekend : RATES.weekday;
  for (const tier of tiers) {
    if (totalHours >= tier.minHour && totalHours <= tier.maxHour) {
      return tier.rate;
    }
  }
  return tiers[tiers.length - 1].rate;
}

export default function Home() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [minDate, setMinDate] = useState("");
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
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

  useEffect(() => {
    const now = new Date();
    const wib = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );
    const yyyy = wib.getFullYear();
    const mm = String(wib.getMonth() + 1).padStart(2, "0");
    const dd = String(wib.getDate()).padStart(2, "0");
    setMinDate(`${yyyy}-${mm}-${dd}`);
  }, []);

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
    if (VOUCHERS[code]) {
      setAppliedVoucher({ code, ...VOUCHERS[code] });
      setVoucherMsg({
        text: `Voucher "${code}" diterapkan — ${VOUCHERS[code].label}`,
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
      rate = getRatePerHour(totalHours, dateObj);
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
  }, [totalHours, dateObj, appliedVoucher]);

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

  const handleSubmit = () => {
    if (!isFormValid || !selectedTable || !startHour || !endHour || !dateObj)
      return;

    const detail = `${name.trim()}, Meja ${selectedTable} · ${formattedDateStr} · ${formattedTimeStr} · Total ${formatRp(
      total
    )}`;
    setBookingSuccess(detail);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="w-full max-w-[560px]">
      {/* Brand Header */}
      <div className="text-center mb-5">
        <div className="w-[44px] h-[44px] mx-auto mb-2 relative">
          <div className="absolute inset-[10px] border-[4px] border-pine rounded-[6px]" />
          <span className="absolute w-[12px] h-[12px] rounded-full bg-pine top-0 left-[12px]" />
          <span className="absolute w-[12px] h-[12px] rounded-full bg-red top-0 right-[12px]" />
          <span className="absolute w-[12px] h-[12px] rounded-full bg-gold-soft bottom-0 left-[12px]" />
          <span className="absolute w-[12px] h-[12px] rounded-full bg-gold bottom-0 right-[12px]" />
        </div>
        <h1 className="font-baloo font-extrabold tracking-[0.06em] text-pine text-[22px] m-0 mb-[2px]">
          SATU MEJA
        </h1>
        <p className="m-0 text-muted text-[13px] tracking-[0.04em]">
          Social Mahjong &amp; Game Club
        </p>
      </div>

      {/* Hero Title & Sub */}
      <div className="text-center font-baloo font-extrabold text-[44px] max-[380px]:text-[34px] text-pine [-webkit-text-stroke:1.5px_var(--color-gold-soft)] mt-[14px] mb-[2px] leading-none">
        BOOKING
      </div>
      <div className="text-center mb-[22px]">
        <span className="inline-block bg-pine text-cream-2 font-baloo font-semibold text-[13px] px-[18px] py-[6px] rounded-full tracking-[0.03em]">
          Jl. Moch. Suyudi No. 71, Semarang · 10:00 – 23:00
        </span>
      </div>

      {/* Card Form */}
      <div className="bg-cream-2 border-2 border-pine rounded-[24px] pt-[26px] px-[22px] pb-[24px] relative shadow-[0_10px_0_-4px_rgba(27,58,43,0.08),0_18px_40px_-20px_rgba(27,58,43,0.35)] before:content-[''] before:absolute before:inset-[6px] before:border before:border-dashed before:border-gold before:rounded-[19px] before:pointer-events-none before:opacity-55">
        {bookingSuccess && (
          <div className="bg-pine text-cream-2 rounded-[16px] p-[16px_18px] mb-4 text-[13.5px] leading-[1.5]">
            <b className="font-baloo">Booking terkonfirmasi!</b>
            <br />
            <span>{bookingSuccess}</span>
          </div>
        )}

        {/* Nama */}
        <div className="mb-4">
          <label
            htmlFor="name"
            className="block font-baloo font-semibold text-[13.5px] text-pine mb-[6px] tracking-[0.02em]"
          >
            Nama
          </label>
          <input
            type="text"
            id="name"
            placeholder="Nama lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white border-[1.5px] border-[#d8cfa9] rounded-[12px] px-[13px] py-[11px] font-inter text-[14.5px] text-ink outline-none transition-all duration-150 appearance-none focus:border-pine focus:ring-3 focus:ring-pine/12 placeholder:text-[#b9b09a]"
          />
        </div>

        {/* Nomor HP */}
        <div className="mb-4">
          <label
            htmlFor="phone"
            className="block font-baloo font-semibold text-[13.5px] text-pine mb-[6px] tracking-[0.02em]"
          >
            Nomor HP
          </label>
          <input
            type="tel"
            id="phone"
            placeholder="08xxxxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-white border-[1.5px] border-[#d8cfa9] rounded-[12px] px-[13px] py-[11px] font-inter text-[14.5px] text-ink outline-none transition-all duration-150 appearance-none focus:border-pine focus:ring-3 focus:ring-pine/12 placeholder:text-[#b9b09a]"
          />
        </div>

        {/* Tanggal */}
        <div className="mb-4">
          <label
            htmlFor="date"
            className="block font-baloo font-semibold text-[13.5px] text-pine mb-[6px] tracking-[0.02em]"
          >
            Tanggal <span className="font-normal text-muted text-[12px] ml-1">(WIB)</span>
          </label>
          <input
            type="date"
            id="date"
            min={minDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white border-[1.5px] border-[#d8cfa9] rounded-[12px] px-[13px] py-[11px] font-inter text-[14.5px] text-ink outline-none transition-all duration-150 appearance-none focus:border-pine focus:ring-3 focus:ring-pine/12 placeholder:text-[#b9b09a]"
          />
        </div>

        {/* Meja */}
        <div className="mb-4">
          <label className="block font-baloo font-semibold text-[13.5px] text-pine mb-[6px] tracking-[0.02em]">
            Meja
          </label>
          <div className="grid grid-cols-6 gap-2 max-[380px]:gap-[6px]" id="tableGrid">
            {TABLES.map((t) => {
              const isActive = selectedTable === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTable(t)}
                  className={`aspect-square rounded-[10px] border-[1.5px] border-[#d8cfa9] bg-white font-baloo font-bold text-[16px] cursor-pointer transition-all duration-150 flex items-center justify-center hover:border-gold ${
                    isActive
                      ? "bg-pine border-pine text-cream-2 shadow-[0_4px_0_-1px_rgba(27,58,43,0.3)]"
                      : "text-pine"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pilih Jam */}
        <div className="mb-4">
          <label className="block font-baloo font-semibold text-[13.5px] text-pine mb-[6px] tracking-[0.02em]">
            Pilih Jam{" "}
            <span className="font-normal text-muted text-[12px] ml-1">
              (klik jam mulai, lalu jam selesai)
            </span>
          </label>
          <div className="grid grid-cols-4 max-[380px]:grid-cols-3 gap-2" id="timeGrid">
            {HOURS.map((h) => {
              const isStart = startHour === h;
              const isEnd = endHour === h;
              const inRange =
                startHour !== null &&
                endHour !== null &&
                h > startHour &&
                h < endHour;

              let btnClass =
                "py-[9px] px-[4px] rounded-[10px] border-[1.5px] border-[#d8cfa9] bg-white font-inter font-semibold text-[12.5px] text-ink cursor-pointer transition-all duration-150 text-center hover:border-gold";

              if (isStart || isEnd) {
                btnClass += " !bg-gold !border-gold !text-pine";
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
          <div className="text-[11.5px] text-muted mt-[6px]" id="timeHint">
            {getTimeHintText()}
          </div>
        </div>

        {/* Kode Voucher */}
        <div className="mb-4">
          <label
            htmlFor="voucher"
            className="block font-baloo font-semibold text-[13.5px] text-pine mb-[6px] tracking-[0.02em]"
          >
            Kode Voucher{" "}
            <span className="font-normal text-muted text-[12px] ml-1">(opsional)</span>
          </label>
          {/* ponytail: stacked input & button vertically to prevent mobile horizontal overflow */}
          <div className="flex flex-col gap-2">
            <input
              type="text"
              id="voucher"
              placeholder="Masukkan kode"
              value={voucherInput}
              onChange={(e) => setVoucherInput(e.target.value)}
              className="w-full bg-white border-[1.5px] border-[#d8cfa9] rounded-[12px] px-[13px] py-[11px] font-inter text-[14.5px] text-ink outline-none transition-all duration-150 appearance-none focus:border-pine focus:ring-3 focus:ring-pine/12 placeholder:text-[#b9b09a]"
            />
            <button
              type="button"
              id="applyVoucher"
              onClick={handleApplyVoucher}
              className="w-full bg-pine text-cream-2 border-none rounded-[12px] py-[11px] font-baloo font-semibold text-[13px] cursor-pointer whitespace-nowrap transition-colors duration-150 hover:bg-pine-2"
            >
              Terapkan
            </button>
          </div>
          <div
            id="voucherMsg"
            className={`text-[12px] mt-[6px] min-h-[14px] ${
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
        <div className="bg-pine text-cream-2 text-center font-baloo font-bold text-[13px] tracking-[0.05em] py-[8px] px-[12px] rounded-full mt-[22px] mb-[14px]">
          RINGKASAN PESANAN
        </div>

        {/* Summary Box */}
        <div className="border-[1.5px] border-dashed border-gold rounded-[14px] p-[14px_16px] bg-[#fffdf5]">
          <div className="flex justify-between items-center text-[13.5px] py-[5px] text-ink">
            <span className="text-muted">Meja</span>
            <span id="sumTable">{selectedTable ? `Meja ${selectedTable}` : "—"}</span>
          </div>
          <div className="flex justify-between items-center text-[13.5px] py-[5px] text-ink">
            <span className="text-muted">Tanggal</span>
            <span id="sumDate">{formattedDateStr}</span>
          </div>
          <div className="flex justify-between items-center text-[13.5px] py-[5px] text-ink">
            <span className="text-muted">Jam</span>
            <span id="sumTime">{formattedTimeStr}</span>
          </div>
          <div className="flex justify-between items-center text-[13.5px] py-[5px] text-ink">
            <span className="text-muted">Total Jam</span>
            <span id="sumHours">{totalHours ? `${totalHours} jam` : "—"}</span>
          </div>
          <div className="border-t border-dashed border-[#d8cfa9] my-2" />
          <div className="flex justify-between items-center text-[13.5px] py-[5px] text-ink">
            <span className="text-muted">Tarif per jam</span>
            <span
              className="bg-pine text-cream-2 font-baloo font-bold text-[13px] px-[12px] py-[4px] rounded-full tracking-[0.02em]"
              id="sumRate"
            >
              {rate ? `${formatRp(rate)}/jam` : "Rp0"}
            </span>
          </div>
          {discount > 0 && (
            <div
              className="flex justify-between items-center text-[13.5px] py-[5px] text-ink"
              id="discountRow"
            >
              <span className="text-muted">Diskon voucher</span>
              <span
                className="bg-[#3f7452] text-cream-2 font-baloo font-bold text-[13px] px-[12px] py-[4px] rounded-full tracking-[0.02em]"
                id="sumDiscount"
              >
                -{formatRp(discount)}
              </span>
            </div>
          )}
          <div className="border-t border-dashed border-[#d8cfa9] my-2" />
          <div className="flex justify-between items-center text-[13.5px] py-[5px] text-ink">
            <span className="font-baloo font-bold text-pine text-[15px]">
              Total Harga
            </span>
            <span
              className="bg-red text-cream-2 font-baloo font-bold text-[16px] px-[16px] py-[6px] rounded-full tracking-[0.02em]"
              id="sumTotal"
            >
              {formatRp(total)}
            </span>
          </div>
        </div>

        {/* Consent */}
        <div className="flex items-start gap-[10px] mt-[18px] mb-[6px]">
          <input
            type="checkbox"
            id="consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-[3px] w-[18px] h-[18px] accent-pine shrink-0 cursor-pointer"
          />
          <label htmlFor="consent" className="text-[12.5px] text-muted leading-[1.5] cursor-pointer">
            Saya menyetujui <b className="text-ink font-bold">syarat &amp; ketentuan</b> booking,
            termasuk kebijakan pembatalan dan keterlambatan Satu Meja Social Mahjong &amp; Game Club.
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          id="submitBtn"
          disabled={!isFormValid}
          onClick={handleSubmit}
          className="w-full bg-gold text-pine border-none rounded-[14px] p-[15px] font-baloo font-bold text-[16px] tracking-[0.03em] cursor-pointer mt-[6px] transition-all duration-150 shadow-[0_4px_0_0_#a9843a] hover:enabled:bg-gold-soft active:enabled:translate-y-[2px] active:enabled:shadow-[0_2px_0_0_#a9843a] disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none"
        >
          Konfirmasi Booking
        </button>

        <p className="text-center text-[11.5px] text-muted mt-4">
          Harga mengikuti tarif weekday (Sen–Kam) &amp; weekend/libur nasional (Jum–Min) yang
          berlaku.
        </p>
      </div>
    </div>
  );
}
