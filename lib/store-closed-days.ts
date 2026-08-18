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

/**
 * Returns the database weekday convention for a YYYY-MM-DD booking date:
 * Sunday is 0 and Monday through Saturday are 1 through 6.
 */
export function getStoreSettingsWeekday(bookingDate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
    return null;
  }

  // Noon WIB keeps the intended calendar day when this runs in any server TZ.
  const date = new Date(`${bookingDate}T12:00:00+07:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return WEEKDAY_INDEX[jakartaWeekdayFormatter.format(date)] ?? null;
}

export function isStoreClosedOnBookingDate(
  bookingDate: string,
  closedWeekdays: readonly number[] | null | undefined,
) {
  const weekday = getStoreSettingsWeekday(bookingDate);
  return weekday !== null && (closedWeekdays ?? []).includes(weekday);
}
