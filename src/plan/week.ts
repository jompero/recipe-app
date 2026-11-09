// Dates for the Plan (US-5.1). A Plan day is keyed by its local calendar date, "YYYY-MM-DD"
// (ADR-0006). Dates are built from year, month and day at local midnight, never by adding
// milliseconds, so a daylight saving change can't move a day.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad = (n: number) => String(n).padStart(2, "0");

/** The local calendar date of `date` as a Plan day key, e.g. "2026-11-05". */
export function toDateKey(date: Date): string {
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local midnight of a "YYYY-MM-DD" key, or null if it isn't a real date. */
export function parseDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  // new Date rolls 2026-02-30 over to March: that's not a real date.
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

/** Local midnight `days` days after `date` (negative goes back). */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Local midnight of the Monday on or before `date`. Weeks run Monday to Sunday. */
export function mondayOf(date: Date): Date {
  const sinceMonday = (date.getDay() + 6) % 7;
  return addDays(date, -sinceMonday);
}

/**
 * The Monday of the week a `?week=` value asks for. Missing or not a date: this week. A day that
 * isn't a Monday: the Monday of its week.
 */
export function weekFromParam(param: string | null, today: Date): Date {
  const date = param === null ? null : parseDateKey(param);
  return mondayOf(date ?? today);
}

/** The seven days of the week starting on `monday`. */
export function weekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** The week's dates as a heading: "3–9 Nov 2026", "27 Oct – 2 Nov 2026", "29 Dec 2025 – 4 Jan 2026". */
export function weekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  const end = `${String(sunday.getDate())} ${MONTHS[sunday.getMonth()]} ${String(sunday.getFullYear())}`;
  if (monday.getFullYear() !== sunday.getFullYear()) {
    return `${String(monday.getDate())} ${MONTHS[monday.getMonth()]} ${String(monday.getFullYear())} – ${end}`;
  }
  if (monday.getMonth() !== sunday.getMonth()) {
    return `${String(monday.getDate())} ${MONTHS[monday.getMonth()]} – ${end}`;
  }
  return `${String(monday.getDate())}–${end}`;
}

/** A day as a short heading: "Tue 4 Nov". */
export function dayLabel(date: Date): string {
  return `${WEEKDAYS[date.getDay()]} ${String(date.getDate())} ${MONTHS[date.getMonth()]}`;
}

/**
 * The Monday-to-Sunday weeks covering `first` to `last` (date keys, both included), as date keys:
 * from the Monday on or before `first` to the Sunday on or after `last`. Empty if either isn't a
 * date or `last` comes before `first`. Lays out the roller's week grid (US-10.8).
 */
export function calendarWeeks(first: string, last: string): string[][] {
  const start = parseDateKey(first);
  const end = parseDateKey(last);
  if (!start || !end || end < start) return [];
  const weeks: string[][] = [];
  for (let monday = mondayOf(start); monday <= end; monday = addDays(monday, 7)) {
    weeks.push(weekDays(monday).map(toDateKey));
  }
  return weeks;
}
