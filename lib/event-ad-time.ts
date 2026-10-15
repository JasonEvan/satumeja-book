// datetime-local has no timezone. Admin always enters WIB (UTC+07:00).
export function parseWibEndTime(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match.map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (
    year < 2000 ||
    year > 9999 ||
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() + 1 !== month ||
    calendarDate.getUTCDate() !== day ||
    calendarDate.getUTCHours() !== hour ||
    calendarDate.getUTCMinutes() !== minute
  ) {
    return null;
  }

  return new Date(calendarDate.getTime() - 7 * 60 * 60 * 1000);
}
