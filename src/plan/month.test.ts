import {
  addMonths,
  firstOfMonth,
  monthFromParam,
  monthKey,
  monthLabel,
  monthWeeks,
  weekForMonth,
} from "./month.ts";
import { toDateKey } from "./week.ts";

const local = (year: number, month: number, day: number) => new Date(year, month - 1, day);
const today = local(2026, 11, 5);

describe("monthFromParam and monthKey", () => {
  test("a month in the URL is its first day", () => {
    expect(monthFromParam("2027-02", today)).toEqual(local(2027, 2, 1));
    expect(monthKey(local(2027, 2, 1))).toBe("2027-02");
  });

  test("missing, or not a month: this month", () => {
    expect(monthFromParam(null, today)).toEqual(local(2026, 11, 1));
    expect(monthFromParam("2026-13", today)).toEqual(local(2026, 11, 1));
    expect(monthFromParam("2026-11-05", today)).toEqual(local(2026, 11, 1));
    expect(monthFromParam("soon", today)).toEqual(local(2026, 11, 1));
  });
});

test("addMonths and firstOfMonth cross years", () => {
  expect(addMonths(local(2026, 12, 1), 1)).toEqual(local(2027, 1, 1));
  expect(addMonths(local(2026, 1, 1), -1)).toEqual(local(2025, 12, 1));
  expect(firstOfMonth(local(2026, 11, 30))).toEqual(local(2026, 11, 1));
});

test("monthLabel names the month and year", () => {
  expect(monthLabel(local(2026, 11, 1))).toBe("November 2026");
});

describe("monthWeeks", () => {
  const range = (first: Date) => {
    const weeks = monthWeeks(first);
    return { count: weeks.length, from: weeks[0]![0], to: weeks.at(-1)![6] };
  };

  test("a month starting on a Monday starts its grid on the 1st", () => {
    expect(range(local(2026, 6, 1))).toEqual({ count: 5, from: "2026-06-01", to: "2026-07-05" });
  });

  test("a month starting on a Sunday needs six weeks", () => {
    expect(range(local(2026, 11, 1))).toEqual({ count: 6, from: "2026-10-26", to: "2026-12-06" });
  });

  test("a February that starts on a Monday fits four weeks exactly", () => {
    expect(range(local(2027, 2, 1))).toEqual({ count: 4, from: "2027-02-01", to: "2027-02-28" });
  });

  test("every week has seven days", () => {
    expect(monthWeeks(local(2026, 3, 1)).every((week) => week.length === 7)).toBe(true);
  });
});

describe("weekForMonth", () => {
  test("this month: this week", () => {
    expect(toDateKey(weekForMonth(local(2026, 11, 1), today))).toBe("2026-11-02");
  });

  test("another month: the week with its 1st", () => {
    expect(toDateKey(weekForMonth(local(2026, 12, 1), today))).toBe("2026-11-30");
    expect(toDateKey(weekForMonth(local(2027, 2, 1), today))).toBe("2027-02-01");
  });
});
