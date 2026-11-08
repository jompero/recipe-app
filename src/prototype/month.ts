// PROTOTYPE (EPIC-10 / US-10.1): throwaway. Month helpers for the Plan's month view.
import { parseDateKey } from "../plan/week.ts";

/** The first of the month a `?month=YYYY-MM` asks for, or this month. */
export function monthFromParam(param: string | null, today: Date): Date {
  const date = param ? parseDateKey(`${param}-01`) : null;
  return date ?? new Date(today.getFullYear(), today.getMonth(), 1);
}

export const monthKey = (first: Date) =>
  `${String(first.getFullYear())}-${String(first.getMonth() + 1).padStart(2, "0")}`;
