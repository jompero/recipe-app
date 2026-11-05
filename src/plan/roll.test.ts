import { storedRecipe } from "../test-utils/recipeFixture.ts";
import {
  clampRange,
  datesBetween,
  decodeRoll,
  encodeRoll,
  noRepeatWindow,
  plannedRecipes,
  rollAdditions,
  rollPool,
  rollRows,
  rowsForRange,
  type Roll,
  type RollRow,
} from "./roll.ts";

/** A random source that returns the given numbers in turn, then repeats them. */
function sequence(...values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length]!;
}

/** A seeded pseudo-random source (mulberry32), for tests that roll many times. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const row = (date: string, state: RollRow["state"] = "rolled", recipeId: string | null = null) => ({
  date,
  state,
  recipeId,
});

const week = ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"].map((date) =>
  row(date),
);

describe("ranges", () => {
  test("datesBetween includes both ends, across a month", () => {
    expect(datesBetween("2026-10-30", "2026-11-02")).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
    expect(datesBetween("2026-11-05", "2026-11-05")).toEqual(["2026-11-05"]);
    expect(datesBetween("2026-11-06", "2026-11-05")).toEqual([]);
  });

  test.each([
    ["a range that fits is kept", "2026-11-02", "2026-11-29", "first", "2026-11-02", "2026-11-29"],
    [
      "a later start pulls the end along",
      "2026-11-10",
      "2026-11-08",
      "first",
      "2026-11-10",
      "2026-11-10",
    ],
    [
      "an earlier end pulls the start along",
      "2026-11-10",
      "2026-11-08",
      "last",
      "2026-11-08",
      "2026-11-08",
    ],
    [
      "an earlier start over 28 days moves the end",
      "2026-11-01",
      "2026-11-29",
      "first",
      "2026-11-01",
      "2026-11-28",
    ],
    [
      "a later end over 28 days moves the start",
      "2026-11-02",
      "2026-11-30",
      "last",
      "2026-11-03",
      "2026-11-30",
    ],
  ] as const)("%s", (_, first, last, changed, newFirst, newLast) => {
    expect(clampRange(first, last, changed)).toEqual({ first: newFirst, last: newLast });
  });

  test("the no-repeat window is 14 days either side", () => {
    expect(noRepeatWindow("2026-11-02", "2026-11-08")).toEqual({
      first: "2026-10-19",
      last: "2026-11-22",
    });
  });

  test("a new range keeps the rows of days still in it", () => {
    const rows = [row("2026-11-02", "locked", "a"), row("2026-11-03", "skipped", "b")];
    expect(rowsForRange(rows, "2026-11-03", "2026-11-04")).toEqual([
      row("2026-11-03", "skipped", "b"),
      row("2026-11-04"),
    ]);
  });
});

describe("the pool", () => {
  const recipes = [
    storedRecipe("Pasta", { tags: ["pasta", "quick"] }),
    storedRecipe("Soup", { tags: ["soup"] }),
    storedRecipe("Old Pasta", { tags: ["pasta"], archived: true }),
    storedRecipe("Salad"),
  ];

  test("every recipe that isn't archived, with no tags selected", () => {
    expect(rollPool(recipes, [])).toEqual(["pasta", "soup", "salad"]);
  });

  test("a recipe needs any one of the selected tags", () => {
    expect(rollPool(recipes, ["soup", "quick"])).toEqual(["pasta", "soup"]);
    expect(rollPool(recipes, ["baking"])).toEqual([]);
  });

  test("planned recipes are collected from Plan days, notes ignored", () => {
    expect(
      plannedRecipes({
        "2026-11-01": [{ id: "1", recipeId: "pasta" }],
        "2026-11-03": [
          { id: "2", note: "Leftovers" },
          { id: "3", recipeId: "soup" },
        ],
        "2026-11-04": [],
      }),
    ).toEqual(new Set(["pasta", "soup"]));
  });
});

describe("rolling", () => {
  const pool = ["a", "b", "c", "d", "e", "f", "g"];

  test("never picks a recipe twice in one roll", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const picks = rollRows(week, pool, new Set(), seeded(seed)).map((r) => r.recipeId);
      expect(new Set(picks).size).toBe(week.length);
    }
  });

  test("Locked days keep their recipe, and it isn't picked again", () => {
    const rows = [row("2026-11-02", "locked", "a"), row("2026-11-03"), row("2026-11-04")];
    for (let seed = 1; seed <= 50; seed++) {
      const rolled = rollRows(rows, ["a", "b", "c"], new Set(), seeded(seed));
      expect(rolled[0]).toEqual(row("2026-11-02", "locked", "a"));
      expect(
        rolled
          .slice(1)
          .map((r) => r.recipeId)
          .sort(),
      ).toEqual(["b", "c"]);
    }
  });

  test("Skipped days aren't rolled, and their recipe doesn't count as picked", () => {
    const rows = [row("2026-11-02", "skipped", "a"), row("2026-11-03")];
    const rolled = rollRows(rows, ["a"], new Set(), sequence(0));
    expect(rolled).toEqual([row("2026-11-02", "skipped", "a"), row("2026-11-03", "rolled", "a")]);
  });

  test("leaves out recipes planned near the range", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const picks = rollRows(week, pool, new Set(["a", "b"]), seeded(seed)).map((r) => r.recipeId);
      expect(picks).not.toContain("a");
      expect(picks).not.toContain("b");
    }
  });

  test("when the pool runs out, planned recipes come back first, then repeats", () => {
    const rows = ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"].map((d) => row(d));
    // Pool of 3, two of them planned. Picks: x (not planned), then planned y and z, then a repeat.
    const picks = rollRows(rows, ["x", "y", "z"], new Set(["y", "z"]), sequence(0)).map(
      (r) => r.recipeId,
    );
    expect(picks[0]).toBe("x");
    expect(picks.slice(1, 3).sort()).toEqual(["y", "z"]);
    expect(["x", "y", "z"]).toContain(picks[3]);
  });

  test("an empty pool leaves the days empty", () => {
    expect(rollRows(week, [], new Set(), Math.random).every((r) => r.recipeId === null)).toBe(true);
  });

  test("the random source decides the pick", () => {
    const one = [row("2026-11-02")];
    expect(rollRows(one, ["a", "b", "c"], new Set(), sequence(0))[0]?.recipeId).toBe("a");
    expect(rollRows(one, ["a", "b", "c"], new Set(), sequence(0.99))[0]?.recipeId).toBe("c");
  });

  test("filling only empty days keeps the other picks and doesn't repeat them", () => {
    const rows = [row("2026-11-02", "rolled", "a"), row("2026-11-03")];
    const filled = rollRows(rows, ["a", "b"], new Set(), sequence(0), (r) => r.recipeId === null);
    expect(filled).toEqual([row("2026-11-02", "rolled", "a"), row("2026-11-03", "rolled", "b")]);
  });

  test("saving adds Rolled and Locked days with a recipe, not Skipped or empty ones", () => {
    expect(
      rollAdditions([
        row("2026-11-02", "rolled", "a"),
        row("2026-11-03", "locked", "b"),
        row("2026-11-04", "skipped", "c"),
        row("2026-11-05", "rolled", null),
      ]),
    ).toEqual([
      { date: "2026-11-02", recipeId: "a" },
      { date: "2026-11-03", recipeId: "b" },
    ]);
  });
});

describe("keeping the roll in sessionStorage", () => {
  const roll: Roll = {
    first: "2026-11-02",
    last: "2026-11-04",
    tags: ["pasta"],
    rows: [
      row("2026-11-02", "locked", "a"),
      row("2026-11-03", "skipped", "b"),
      row("2026-11-04", "rolled", null),
    ],
  };

  test("round trip", () => {
    expect(decodeRoll(encodeRoll(roll))).toEqual(roll);
  });

  test.each([
    ["nothing stored", null],
    ["not JSON", "{oops"],
    ["another version", JSON.stringify({ ...roll, version: 2 })],
    ["no version", JSON.stringify(roll)],
    ["rows that don't match the range", encodeRoll({ ...roll, last: "2026-11-05" })],
    [
      "a bad state",
      encodeRoll({ ...roll, rows: [{ ...roll.rows[0]!, state: "maybe" as "rolled" }] }),
    ],
    ["a range over 28 days", encodeRoll({ ...roll, last: "2026-12-31" })],
    ["a date that isn't real", encodeRoll({ ...roll, first: "2026-02-30" })],
  ])("%s is ignored", (_, text) => {
    expect(decodeRoll(text)).toBeNull();
  });
});
