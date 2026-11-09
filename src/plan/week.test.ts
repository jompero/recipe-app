import {
  calendarWeeks,
  addDays,
  dayLabel,
  mondayOf,
  parseDateKey,
  toDateKey,
  weekDays,
  weekFromParam,
  weekLabel,
} from "./week.ts";

// A zone with daylight saving, so the tests below cross real clock changes. Node reads TZ again
// whenever it changes. Put back afterwards, in case the worker runs another file next.
vi.stubEnv("TZ", "Europe/Helsinki");
afterAll(() => {
  vi.unstubAllEnvs();
});

const local = (year: number, month: number, day: number, hour = 0, minute = 0) =>
  new Date(year, month - 1, day, hour, minute);

describe("toDateKey and parseDateKey", () => {
  test("a key is the local calendar date, also just before and after midnight", () => {
    expect(toDateKey(local(2026, 11, 5, 23, 59))).toBe("2026-11-05");
    expect(toDateKey(local(2026, 11, 6, 0, 1))).toBe("2026-11-06");
    expect(toDateKey(local(2026, 1, 9))).toBe("2026-01-09");
  });

  test("a key parses to local midnight", () => {
    expect(parseDateKey("2026-11-05")).toEqual(local(2026, 11, 5));
  });

  test.each(["", "2026-11-5", "2026/11/05", "2026-02-30", "2026-13-01", "nope", "2026-11-05x"])(
    "%j isn't a date",
    (key) => {
      expect(parseDateKey(key)).toBeNull();
    },
  );
});

describe("mondayOf", () => {
  test.each([
    ["Monday", local(2026, 11, 2), "2026-11-02"],
    ["Thursday evening", local(2026, 11, 5, 21), "2026-11-02"],
    ["Sunday just before midnight", local(2026, 11, 8, 23, 59), "2026-11-02"],
    ["the next Monday just after midnight", local(2026, 11, 9, 0, 1), "2026-11-09"],
    ["a Sunday in a week that crosses the year", local(2027, 1, 3), "2026-12-28"],
  ])("%s", (_, date, monday) => {
    expect(toDateKey(mondayOf(date))).toBe(monday);
  });
});

describe("weeks across daylight saving changes", () => {
  // In Europe the clocks go forward on 29 Mar 2026 and back on 25 Oct 2026 (both Sundays). CI runs
  // in UTC, which has no clock changes, so this file runs in Helsinki time (see the top).
  test("the clocks do change in this file's time zone", () => {
    expect(local(2026, 3, 28).getTimezoneOffset()).not.toBe(local(2026, 3, 30).getTimezoneOffset());
  });

  test.each([
    ["spring", "2026-03-23", "2026-03-29", "2026-03-30"],
    ["autumn", "2026-10-19", "2026-10-25", "2026-10-26"],
  ])("%s: seven days, Monday to Sunday, then the next Monday", (_, monday, sunday, next) => {
    const days = weekDays(parseDateKey(monday)!).map(toDateKey);
    expect(days).toHaveLength(7);
    expect(days[0]).toBe(monday);
    expect(days[6]).toBe(sunday);
    expect(toDateKey(addDays(parseDateKey(monday)!, 7))).toBe(next);
    expect(toDateKey(mondayOf(parseDateKey(sunday)!))).toBe(monday);
  });
});

describe("weekFromParam", () => {
  const today = local(2026, 11, 5, 18);

  test.each([
    ["missing", null, "2026-11-02"],
    ["not a date", "soon", "2026-11-02"],
    ["an impossible date", "2026-02-31", "2026-11-02"],
    ["a Monday", "2026-12-07", "2026-12-07"],
    ["a Wednesday", "2026-12-09", "2026-12-07"],
  ])("%s → that week's Monday", (_, param, monday) => {
    expect(toDateKey(weekFromParam(param, today))).toBe(monday);
  });
});

describe("labels", () => {
  test.each([
    ["one month", "2026-11-02", "2–8 Nov 2026"],
    ["two months", "2026-10-26", "26 Oct – 1 Nov 2026"],
    ["two years", "2025-12-29", "29 Dec 2025 – 4 Jan 2026"],
  ])("a week in %s", (_, monday, label) => {
    expect(weekLabel(parseDateKey(monday)!)).toBe(label);
  });

  test("a day", () => {
    expect(dayLabel(local(2026, 11, 4))).toBe("Wed 4 Nov");
    expect(dayLabel(local(2026, 11, 8))).toBe("Sun 8 Nov");
  });
});

describe("calendarWeeks", () => {
  test("a range starting mid-week fills its week from Monday to Sunday", () => {
    expect(calendarWeeks("2026-11-04", "2026-11-06")).toEqual([
      [
        "2026-11-02",
        "2026-11-03",
        "2026-11-04",
        "2026-11-05",
        "2026-11-06",
        "2026-11-07",
        "2026-11-08",
      ],
    ]);
  });

  test("a range over two weeks gives two rows", () => {
    const weeks = calendarWeeks("2026-11-06", "2026-11-12");
    expect(weeks).toHaveLength(2);
    expect(weeks[0]![0]).toBe("2026-11-02");
    expect(weeks[1]![6]).toBe("2026-11-15");
  });

  test("a single day is one week", () => {
    expect(calendarWeeks("2026-11-08", "2026-11-08")).toEqual([
      [
        "2026-11-02",
        "2026-11-03",
        "2026-11-04",
        "2026-11-05",
        "2026-11-06",
        "2026-11-07",
        "2026-11-08",
      ],
    ]);
  });

  test("weeks across a clock change and a new year keep seven days each", () => {
    const weeks = calendarWeeks("2026-10-22", "2027-01-02");
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0]!.at(-1)).toBe("2026-10-25"); // clocks go back in Helsinki that Sunday
    expect(weeks[1]![0]).toBe("2026-10-26");
    expect(weeks.at(-1)).toEqual([
      "2026-12-28",
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
    ]);
  });

  test("a backwards range or a non-date is empty", () => {
    expect(calendarWeeks("2026-11-08", "2026-11-01")).toEqual([]);
    expect(calendarWeeks("soon", "2026-11-01")).toEqual([]);
  });
});
