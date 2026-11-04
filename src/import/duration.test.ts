import { durationMinutes, formatMinutes, formatDuration } from "./duration.ts";

describe("formatDuration", () => {
  it.each([
    ["PT1H30M", "1 hr 30 min"],
    ["PT45M", "45 min"],
    ["P0DT0H20M", "20 min"],
    ["PT90M", "1 hr 30 min"],
    ["PT2H", "2 hr"],
    ["P1DT2H", "26 hr"],
    ["pt10m", "10 min"],
    [" PT15M ", "15 min"],
    ["PT1H0M30S", "1 hr 1 min"],
    ["PT0.5H", "30 min"],
  ])("formats %j as %j", (iso, text) => {
    expect(formatDuration(iso)).toBe(text);
  });

  it.each([[""], ["PT"], ["P"], ["45 minutes"], ["PT0M"], ["PTXM"], ["1:30"]])(
    "gives an empty string for %j",
    (iso) => {
      expect(formatDuration(iso)).toBe("");
    },
  );

  it.each([[undefined], [null], [45], [["PT45M"]], [{}]])(
    "gives an empty string for the non-string %j",
    (value) => {
      expect(formatDuration(value)).toBe("");
    },
  );
});

describe("durationMinutes", () => {
  it("gives whole minutes, or null when the value isn't a duration", () => {
    expect(durationMinutes("PT1H5M")).toBe(65);
    expect(durationMinutes("PT0M")).toBe(0);
    expect(durationMinutes("soon")).toBeNull();
    expect(durationMinutes(undefined)).toBeNull();
  });
});

describe("formatMinutes", () => {
  it("writes hours and minutes, and nothing for zero", () => {
    expect(formatMinutes(65)).toBe("1 hr 5 min");
    expect(formatMinutes(60)).toBe("1 hr");
    expect(formatMinutes(5)).toBe("5 min");
    expect(formatMinutes(0)).toBe("");
  });
});
