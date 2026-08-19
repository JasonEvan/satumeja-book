const JAKARTA_TIME_ZONE = "Asia/Jakarta";

const jakartaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: JAKARTA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export interface VoucherValidityWindow {
  start_date?: string | null;
  end_date?: string | null;
}

function getJakartaDate(value: Date) {
  return jakartaDateFormatter.format(value);
}

function getVoucherCalendarDate(value: string) {
  // Voucher dates are configured as calendar days. Keep the date portion as
  // entered instead of converting a UTC timestamp into another calendar day.
  const datePart = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  return datePart || getJakartaDate(new Date(value));
}

export function isVoucherValidToday(voucher: VoucherValidityWindow) {
  return isVoucherValidForBookingDate(voucher, getJakartaDate(new Date()));
}

export function isVoucherValidForBookingDate(
  voucher: VoucherValidityWindow,
  bookingDate: string,
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
    return false;
  }

  const startsOn = voucher.start_date
    ? getVoucherCalendarDate(voucher.start_date)
    : null;
  const endsOn = voucher.end_date
    ? getVoucherCalendarDate(voucher.end_date)
    : null;

  return (
    (!startsOn || bookingDate >= startsOn) &&
    (!endsOn || bookingDate <= endsOn)
  );
}
