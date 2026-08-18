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

export function isVoucherCurrentlyValid(
  voucher: VoucherValidityWindow,
  now: Date = new Date(),
) {
  const today = getJakartaDate(now);
  const startsOn = voucher.start_date
    ? getJakartaDate(new Date(voucher.start_date))
    : null;
  const endsOn = voucher.end_date
    ? getJakartaDate(new Date(voucher.end_date))
    : null;

  return (!startsOn || today >= startsOn) && (!endsOn || today <= endsOn);
}
