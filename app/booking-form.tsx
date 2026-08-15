"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

import { calculateBookingTotals } from "@/lib/booking-pricing";
import type {
  RatesData,
  StoreSettingsData,
  TableItem,
  VoucherItem,
} from "@/lib/booking-types";

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
  initialStoreSettings?: StoreSettingsData;
}

export default function BookingForm({
  initialTables,
  initialRates,
  initialVouchers,
  initialStoreSettings,
}: BookingFormProps) {
  const [isSnapReady, setIsSnapReady] = useState(
    () => typeof window !== "undefined" && !!window.snap,
  );
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
  const [bookingPending, setBookingPending] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [reservedHours, setReservedHours] = useState<Set<number>>(new Set());

  useEffect(() => {
    const snapUrl = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL;
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

    if (!snapUrl || !clientKey) {
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-midtrans-snap="true"]',
    );

    if (existingScript) {
      if (!window.snap) {
        existingScript.addEventListener("load", () => setIsSnapReady(true), {
          once: true,
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = snapUrl;
    script.dataset.clientKey = clientKey;
    script.dataset.midtransSnap = "true";
    script.async = true;
    script.onload = () => setIsSnapReady(true);
    script.onerror = () =>
      setBookingError("Gagal memuat Midtrans Snap. Silakan refresh halaman.");
    document.body.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  // Fetch reserved time slots asynchronously from Supabase when selectedTable or date changes
  useEffect(() => {
    if (!selectedTable || !date) return;

    const selectedItem = initialTables.find(
      (t) => t.id === selectedTable || t.name === selectedTable
    );

    if (!selectedItem?.id) return;

    let isMounted = true;

    const fetchReservedSlots = async () => {
      try {
        const supabase = createClient();
        const dayStartIso = `${date}T00:00:00+07:00`;
        const dayEndIso = `${date}T23:59:59+07:00`;
        type RentalSlotRow = {
          started_at?: string | null;
          estimated_ended_at?: string | null;
          status?: string | null;
          payment_expired_at?: string | null;
        };

        let { data: dbRentals, error } = (await supabase
          .from("rentals")
          .select("started_at, estimated_ended_at, status, payment_expired_at")
          .eq("asset_id", selectedItem.id)
          .in("status", ["active", "reserved", "pending_payment"])
          .gte("started_at", dayStartIso)
          .lte("started_at", dayEndIso)) as {
          data: RentalSlotRow[] | null;
          error: unknown;
        };

        if (error) {
          const fallback = await supabase
            .from("rentals")
            .select("started_at, estimated_ended_at, status, created_at")
            .eq("asset_id", selectedItem.id)
            .in("status", ["active", "reserved", "pending_payment"])
            .gte("started_at", dayStartIso)
            .lte("started_at", dayEndIso);

          dbRentals = (fallback.data || []).map((row) => ({
            started_at: row.started_at,
            estimated_ended_at: row.estimated_ended_at,
            status: row.status,
            payment_expired_at:
              row.status === "pending_payment" && row.created_at
                ? new Date(
                    new Date(row.created_at).getTime() + 15 * 60 * 1000,
                  ).toISOString()
                : null,
          }));
          error = fallback.error;
        }

        if (isMounted && dbRentals && !error) {
          const booked = new Set<number>();
          const now = Date.now();
          dbRentals.forEach((r) => {
            if (!r.started_at || !r.estimated_ended_at) return;
            if (
              r.status === "pending_payment" &&
              r.payment_expired_at &&
              new Date(r.payment_expired_at).getTime() <= now
            ) {
              return;
            }

            const startWib = new Date(
              new Date(r.started_at).toLocaleString("en-US", {
                timeZone: "Asia/Jakarta",
              })
            );
            const endWib = new Date(
              new Date(r.estimated_ended_at).toLocaleString("en-US", {
                timeZone: "Asia/Jakarta",
              })
            );

            const startH = startWib.getHours();
            let endH = endWib.getHours();
            if (endWib.getMinutes() > 0) {
              endH += 1;
            }

            for (let h = startH; h < endH; h++) {
              if (h >= OPEN_HOUR && h <= CLOSE_HOUR) {
                booked.add(h);
              }
            }
          });

          setReservedHours(booked);
        }
      } catch {
        // Fallback
      }
    };

    fetchReservedSlots();

    return () => {
      isMounted = false;
    };
  }, [selectedTable, date, initialTables]);

  const activeReservedHours = useMemo(() => {
    if (!selectedTable || !date) return new Set<number>();
    return reservedHours;
  }, [selectedTable, date, reservedHours]);

  const isRangeAvailable = (fromHour: number, toHour: number) => {
    for (let hour = fromHour; hour < toHour; hour += 1) {
      if (activeReservedHours.has(hour)) {
        return false;
      }
    }

    return true;
  };

  const handleTimeClick = (h: number) => {
    if (!selectedTable) return;

    if (startHour === null || (startHour !== null && endHour !== null)) {
      if (activeReservedHours.has(h)) return;
      setStartHour(h);
      setEndHour(null);
    } else {
      if (h <= startHour) {
        if (activeReservedHours.has(h)) return;
        setStartHour(h);
        setEndHour(null);
      } else {
        if (!isRangeAvailable(startHour, h)) {
          if (activeReservedHours.has(h)) return;
          setStartHour(h);
          setEndHour(null);
        } else {
          setEndHour(h);
        }
      }
    }
  };

  const getTimeHintText = () => {
    if (!date) {
      return "Silakan pilih tanggal terlebih dahulu.";
    } else if (!selectedTable) {
      return "Silakan pilih meja terlebih dahulu.";
    } else if (startHour === null) {
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

  const { rate, subtotal, discount, serviceChargeAmount, taxAmount, total } =
    useMemo(
      () =>
        calculateBookingTotals({
          totalHours,
          dateObj,
          activeRates: initialRates,
          appliedVoucher,
          storeSettings: initialStoreSettings,
        }),
      [totalHours, dateObj, appliedVoucher, initialRates, initialStoreSettings],
    );

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

  const pollBookingStatus = async (orderId: string) => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await fetch(
        `/api/payment/verify-status?orderId=${encodeURIComponent(orderId)}`,
        {
          cache: "no-store",
        },
      );

      if (response.ok) {
        const payload = (await response.json()) as {
          status?: string;
        };

        if (payload.status === "reserved") {
          return "reserved";
        }

        if (
          payload.status &&
          ["payment_failed", "expired", "cancelled"].includes(payload.status)
        ) {
          return payload.status;
        }
      }

      await new Promise((resolve) => window.setTimeout(resolve, 2000));
    }

    return "pending_payment";
  };

  const handleSubmit = async () => {
    if (
      !isFormValid ||
      selectedTable === null ||
      startHour === null ||
      endHour === null ||
      !dateObj
    )
      return;

    const selectedItem = initialTables.find(
      (t) => t.id === selectedTable || t.name === selectedTable
    );

    const tableName =
      typeof selectedTable === "string"
        ? selectedTable
        : `Meja ${selectedTable}`;

    setIsSubmitting(true);
    setBookingError(null);
    setBookingSuccess(null);
    setBookingPending(null);

    try {
      if (!window.snap || !isSnapReady) {
        throw new Error("Midtrans Snap belum siap. Silakan coba lagi.");
      }

      const response = await fetch("/api/payment/create-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          assetId: String(selectedItem?.id || ""),
          date,
          startHour,
          endHour,
          voucherCode: appliedVoucher?.code || null,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        snapToken?: string;
        orderId?: string;
        paymentExpiresAt?: string | null;
      };

      if (!response.ok || !payload.snapToken || !payload.orderId) {
        throw new Error(payload.error || "Gagal membuat transaksi pembayaran.");
      }

      const pendingText = payload.paymentExpiresAt
        ? `Menunggu pembayaran sampai ${new Date(
            payload.paymentExpiresAt,
          ).toLocaleString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })} WIB.`
        : "Menunggu pembayaran Anda di Midtrans.";

      setBookingPending(pendingText);

      window.snap.pay(payload.snapToken, {
        onSuccess: async () => {
          const finalStatus = await pollBookingStatus(payload.orderId!);

          if (finalStatus === "reserved") {
            const detail = `${name.trim()}, ${tableName} · ${formattedDateStr} · ${formattedTimeStr} · Total ${formatRp(
              total,
            )}`;
            setBookingPending(null);
            setBookingSuccess(detail);
            return;
          }

          setBookingPending(
            "Pembayaran diterima, tetapi konfirmasi booking masih menunggu sinkronisasi webhook.",
          );
        },
        onPending: () => {
          setBookingPending(pendingText);
        },
        onError: () => {
          setBookingPending(null);
          setBookingError("Pembayaran gagal diproses. Silakan coba lagi.");
        },
        onClose: () => {
          setBookingPending(
            "Pembayaran belum selesai. Anda bisa melanjutkan pembayaran dari sesi Midtrans yang sama selama belum kedaluwarsa.",
          );
        },
      });
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
    return (
      initialTables.find((item) => item.id === selectedTable || item.name === selectedTable)
        ?.label || String(selectedTable)
    );
  };

  return (
    <section aria-label="Form Booking Mahjong">
      {/* Card Form */}
      <div className="bg-cream-2 border-2 border-pine rounded-3xl p-6 relative shadow-[0_10px_0_-4px_rgba(27,58,43,0.08),0_18px_40px_-20px_rgba(27,58,43,0.35)] before:content-[''] before:absolute before:top-1.5 before:right-1.5 before:bottom-1.5 before:left-1.5 before:border before:border-dashed before:border-gold before:rounded-[19px] before:pointer-events-none before:opacity-55">
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

        {bookingPending && (
          <div className="bg-gold text-pine rounded-2xl p-4 mb-4 text-[13.5px] leading-normal shadow-sm">
            <b className="font-baloo text-base">Menunggu Pembayaran</b>
            <br />
            <span>{bookingPending}</span>
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
            Pilih Meja / Unit{" "}
            {!date && (
              <span className="font-normal text-muted text-xs ml-1">
                (pilih tanggal terlebih dahulu)
              </span>
            )}
          </label>
          <div
            className="grid grid-cols-3 sm:grid-cols-6 gap-2"
            id="tableGrid"
          >
            {initialTables.map((t) => {
              const isDateSelected = date !== "";
              const isActive =
                isDateSelected &&
                (selectedTable === t.id || selectedTable === t.name);

              let btnClass =
                "min-h-[44px] rounded-xl border-[1.5px] font-baloo font-bold text-xs sm:text-sm p-2 text-center leading-tight break-words transition-all duration-150 flex items-center justify-center";

              if (!isDateSelected) {
                btnClass +=
                  " bg-[#eae5d8] border-[#d8cfa9] text-[#a09885] cursor-not-allowed opacity-75";
              } else if (isActive) {
                btnClass +=
                  " bg-pine border-pine text-cream-2 shadow-[0_3px_0_0_rgba(27,58,43,0.3)] cursor-pointer";
              } else {
                btnClass +=
                  " bg-white border-[#d8cfa9] text-pine hover:border-gold cursor-pointer";
              }

              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={!isDateSelected}
                  onClick={() => setSelectedTable(t.id)}
                  className={btnClass}
                  title={
                    !isDateSelected
                      ? "Silakan pilih tanggal terlebih dahulu"
                      : undefined
                  }
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
              const isTableSelected = selectedTable !== null;
              const isReserved = activeReservedHours.has(h);
              const isStart = startHour === h;
              const isEnd = endHour === h;
              const inRange =
                startHour !== null &&
                endHour !== null &&
                h > startHour &&
                h < endHour;
              const canUseAsEndBoundary =
                isTableSelected &&
                startHour !== null &&
                endHour === null &&
                h > startHour &&
                isRangeAvailable(startHour, h);
              const isDisabled =
                !isTableSelected || (isReserved && !canUseAsEndBoundary);

              let btnClass =
                "py-2 px-1 rounded-xl border-[1.5px] border-[#d8cfa9] font-inter font-semibold text-[12.5px] text-center transition-all duration-150";

              if (isDisabled) {
                btnClass +=
                  " !bg-[#eae5d8] !border-[#d8cfa9] !text-[#a09885] !cursor-not-allowed opacity-75" +
                  (isReserved ? " line-through" : "");
              } else if (isStart || isEnd) {
                btnClass += " !bg-gold !border-gold !text-pine font-bold shadow-xs cursor-pointer";
              } else if (inRange) {
                btnClass += " !bg-gold-soft !border-gold cursor-pointer";
              } else {
                btnClass += " bg-white text-ink cursor-pointer hover:border-gold";
              }

              const tooltip = !isTableSelected
                ? "Silakan pilih meja terlebih dahulu"
                : canUseAsEndBoundary
                  ? "Jam ini bisa dipilih sebagai batas akhir booking"
                : isReserved
                  ? "Meja/Unit ini sudah dipesan pada jam ini"
                  : undefined;

              return (
                <button
                  key={h}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleTimeClick(h)}
                  className={btnClass}
                  title={tooltip}
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
          {subtotal > 0 && (
            <div className="flex justify-between items-center text-[13.5px] py-1.5 text-ink">
              <span className="text-muted">Subtotal</span>
              <span className="font-semibold text-ink">
                {formatRp(subtotal)}
              </span>
            </div>
          )}
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
          {serviceChargeAmount > 0 && (
            <div className="flex justify-between items-center text-[13.5px] py-1.5 text-ink">
              <span className="text-muted">
                Service Charge ({initialStoreSettings?.serviceChargePercentage}%)
              </span>
              <span className="font-semibold text-ink">
                +{formatRp(serviceChargeAmount)}
              </span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between items-center text-[13.5px] py-1.5 text-ink">
              <span className="text-muted">
                Pajak / Tax ({initialStoreSettings?.taxPercentage}%)
              </span>
              <span className="font-semibold text-ink">
                +{formatRp(taxAmount)}
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
            <a
              href="/syarat-dan-ketentuan"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pine font-bold underline hover:text-gold transition-colors"
            >
              syarat &amp; ketentuan
            </a>{" "}
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
          {isSubmitting ? "Memproses..." : "Bayar & Konfirmasi Booking"}
        </button>

        <p className="text-center text-[11.5px] text-muted mt-4">
          Harga mengikuti tarif weekday (Sen–Kam) &amp; weekend/libur nasional
          (Jum–Min) yang berlaku.
        </p>
      </div>
    </section>
  );
}
