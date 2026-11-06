import { groupByRecipe } from "./groupByRecipe.ts";
import type { SourceLine } from "./types.ts";

const fromEntry = (id: string, entryId: string, title: string, scale = 1): SourceLine => ({
  id,
  raw: `line ${id}`,
  scale,
  recipeId: title.toLowerCase(),
  title,
  entryId,
});
const byHand = (id: string): SourceLine => ({ id, raw: `line ${id}`, scale: 1 });

describe("groupByRecipe", () => {
  test("one group per Plan entry in build order, lines added by hand last", () => {
    const lines = [
      byHand("h1"),
      fromEntry("a1", "e1", "Pasta"),
      fromEntry("b1", "e2", "Curry", 2),
      fromEntry("a2", "e1", "Pasta"),
      byHand("h2"),
    ];
    expect(groupByRecipe(lines)).toEqual([
      { entryId: "e1", recipeId: "pasta", title: "Pasta", scale: 1, lines: [lines[1], lines[3]] },
      { entryId: "e2", recipeId: "curry", title: "Curry", scale: 2, lines: [lines[2]] },
      { lines: [lines[0], lines[4]] },
    ]);
  });

  test("the same recipe planned twice is two groups", () => {
    const groups = groupByRecipe([fromEntry("a", "e1", "Pasta"), fromEntry("b", "e2", "Pasta")]);
    expect(groups.map((group) => group.entryId)).toEqual(["e1", "e2"]);
  });

  test("no hand-added group when nothing was added by hand", () => {
    expect(groupByRecipe([fromEntry("a", "e1", "Pasta")])).toHaveLength(1);
    expect(groupByRecipe([])).toEqual([]);
  });
});
