import type { RatesData, StoreSettingsData } from "@/lib/booking-types";

const JAKARTA_TIME_ZONE = "Asia/Jakarta";
const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const jakartaWeekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: JAKARTA_TIME_ZONE,
});

export function getWeekendDays(storeSettings?: StoreSettingsData) {
  return storeSettings?.weekendDays?.length ? storeSettings.weekendDays : [0, 5, 6];
}

export function isWeekend(dateObj: Date, weekendDays?: number[]) {
  const weekday = jakartaWeekdayFormatter.format(dateObj);
  return (weekendDays || [0, 5, 6]).includes(WEEKDAY_INDEX[weekday]);
}

export function getRatePerHour(
  totalHours: number,
  dateObj: Date,
  activeRates: RatesData,
  weekendDays?: number[],
) {
  const tiers = isWeekend(dateObj, weekendDays)
    ? activeRates.weekend
    : activeRates.weekday;

  for (const tier of tiers) {
    if (totalHours >= tier.minHour && totalHours <= tier.maxHour) {
      return tier.rate;
    }
  }

  return tiers[tiers.length - 1]?.rate || 0;
}

export function calculateBookingTotals(args: {
  totalHours: number;
  dateObj: Date | null;
  activeRates: RatesData;
  appliedVoucher:
    | {
        type: "percent" | "flat";
        value: number;
      }
    | null
    | undefined;
  storeSettings?: StoreSettingsData;
}) {
  const { totalHours, dateObj, activeRates, appliedVoucher, storeSettings } = args;

  let rate = 0;
  let subtotal = 0;
  let discount = 0;
  let serviceChargeAmount = 0;
  let taxAmount = 0;
  let total = 0;

  if (totalHours > 0 && dateObj) {
    rate = getRatePerHour(
      totalHours,
      dateObj,
      activeRates,
      getWeekendDays(storeSettings),
    );
    subtotal = rate * totalHours;

    if (appliedVoucher) {
      discount =
        appliedVoucher.type === "percent"
          ? subtotal * (appliedVoucher.value / 100)
          : Math.min(appliedVoucher.value, subtotal);
    }

    const netSubtotal = Math.max(subtotal - discount, 0);
    const servicePct = storeSettings?.serviceChargePercentage || 0;
    const taxPct = storeSettings?.taxPercentage || 0;

    if (servicePct > 0) {
      serviceChargeAmount = Math.round(netSubtotal * (servicePct / 100));
    }

    if (taxPct > 0) {
      taxAmount = Math.round((netSubtotal + serviceChargeAmount) * (taxPct / 100));
    }

    total = netSubtotal + serviceChargeAmount + taxAmount;
  }

  return {
    rate,
    subtotal,
    discount,
    serviceChargeAmount,
    taxAmount,
    total,
  };
}
