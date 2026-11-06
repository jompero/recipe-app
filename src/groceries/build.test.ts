import { storedRecipe } from "../test-utils/recipeFixture.ts";
import { defaultRange, linesFor } from "./build.ts";

const day = (key: string) => new Date(`${key}T12:00:00`);

describe("defaultRange", () => {
  test("this week: from today to Sunday", () => {
    expect(defaultRange(day("2026-11-06"), day("2026-11-02"))).toEqual({
      first: "2026-11-06",
      last: "2026-11-08",
    });
  });

  test("next week: from today to that week's Sunday", () => {
    expect(defaultRange(day("2026-11-06"), day("2026-11-09"))).toEqual({
      first: "2026-11-06",
      last: "2026-11-15",
    });
  });

  test("a past week: its Monday to Sunday", () => {
    expect(defaultRange(day("2026-11-06"), day("2026-10-26"))).toEqual({
      first: "2026-10-26",
      last: "2026-11-01",
    });
  });

  test("a week far ahead keeps its Sunday and stays within 28 days", () => {
    expect(defaultRange(day("2026-11-06"), day("2026-12-07"))).toEqual({
      first: "2026-11-16",
      last: "2026-12-13",
    });
  });
});

describe("linesFor", () => {
  const pasta = storedRecipe("Pasta", {
    ingredients: [
      { raw: "400 g pasta", qty: 400, unit: "g", item: "pasta" },
      { header: "Sauce" },
      { raw: "1 dl cream", qty: 1, unit: "dl", item: "cream" },
    ],
  });
  const soup = storedRecipe("Soup", { ingredients: [{ raw: "1 onion", qty: 1, item: "onion" }] });

  test("each ingredient line of each picked entry, headers left out, with the entry's details", () => {
    const { lines, skipped } = linesFor(
      [
        { entry: { id: "e1", recipeId: "pasta", scale: 2 }, recipe: pasta },
        { entry: { id: "e2", recipeId: "soup" }, recipe: soup },
      ],
      [],
    );

    expect(skipped).toBe(0);
    expect(lines).toEqual([
      { raw: "400 g pasta", scale: 2, recipeId: "pasta", title: "Pasta", entryId: "e1" },
      { raw: "1 dl cream", scale: 2, recipeId: "pasta", title: "Pasta", entryId: "e1" },
      { raw: "1 onion", scale: 1, recipeId: "soup", title: "Soup", entryId: "e2" },
    ]);
  });

  test("entries already on the list are left out and counted", () => {
    const onList = [{ id: "l1", raw: "400 g pasta", scale: 1, recipeId: "pasta", entryId: "e1" }];

    const { lines, skipped } = linesFor(
      [
        { entry: { id: "e1", recipeId: "pasta" }, recipe: pasta },
        { entry: { id: "e2", recipeId: "soup" }, recipe: soup },
      ],
      onList,
    );

    expect(skipped).toBe(1);
    expect(lines.map((line) => line.entryId)).toEqual(["e2"]);
  });
});
