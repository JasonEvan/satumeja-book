const WIB_TIME_ZONE = "Asia/Jakarta";

function getWibNowParts(now: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: WIB_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(getPart("year")),
    month: Number(getPart("month")),
    day: Number(getPart("day")),
    hour: Number(getPart("hour")),
    minute: Number(getPart("minute")),
    second: Number(getPart("second")),
  };
}

export function getTodayWib(now: Date = new Date()) {
  const { year, month, day } = getWibNowParts(now);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isPastBookingStart(
  date: string,
  startHour: number,
  now: Date = new Date(),
) {
  if (!date || !Number.isFinite(startHour)) {
    return false;
  }

  const [yearStr, monthStr, dayStr] = date.split("-");
  const bookingYear = Number(yearStr);
  const bookingMonth = Number(monthStr);
  const bookingDay = Number(dayStr);

  if (
    !Number.isInteger(bookingYear) ||
    !Number.isInteger(bookingMonth) ||
    !Number.isInteger(bookingDay)
  ) {
    return false;
  }

  const current = getWibNowParts(now);

  if (bookingYear !== current.year) {
    return bookingYear < current.year;
  }

  if (bookingMonth !== current.month) {
    return bookingMonth < current.month;
  }

  if (bookingDay !== current.day) {
    return bookingDay < current.day;
  }

  if (startHour !== current.hour) {
    return startHour < current.hour;
  }

  return current.minute > 0 || current.second > 0;
}
