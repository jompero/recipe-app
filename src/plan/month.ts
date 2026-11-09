// Months for the Plan's month view (US-10.9). A month is named by its first day; its grid is the
// Monday-to-Sunday weeks covering it (calendarWeeks), so it starts and ends with days of the
// months either side.
import { calendarWeeks, mondayOf, parseDateKey, toDateKey } from "./week.ts";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Local midnight on the first of `date`'s month. */
export function firstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** A month as it goes in the URL: "2026-11". */
export function monthKey(first: Date): string {
  return toDateKey(first).slice(0, 7);
}

/** The first of the month a `?month=` value asks for: "YYYY-MM". Missing or not a month: this one. */
export function monthFromParam(param: string | null, today: Date): Date {
  const date = param !== null && /^\d{4}-\d{2}$/.test(param) ? parseDateKey(`${param}-01`) : null;
  return date ?? firstOfMonth(today);
}

/** The month `months` after the one starting `first` (negative goes back). */
export function addMonths(first: Date, months: number): Date {
  return new Date(first.getFullYear(), first.getMonth() + months, 1);
}

/** The month as a heading: "November 2026". */
export function monthLabel(first: Date): string {
  return `${MONTHS[first.getMonth()]!} ${String(first.getFullYear())}`;
}

/** The month's grid: the Monday-to-Sunday weeks covering it, as date keys (four to six weeks). */
export function monthWeeks(first: Date): string[][] {
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  return calendarWeeks(toDateKey(first), toDateKey(last));
}

/**
 * The week the month view hands to Roll… and Grocery list…, as its Monday: this week if the month
 * shown has today in it, otherwise the month's first week.
 */
export function weekForMonth(first: Date, today: Date): Date {
  return monthKey(first) === monthKey(today) ? mondayOf(today) : mondayOf(first);
}
