// Building the grocery list from the Plan (US-6.4): the builder's default range, and the source
// lines for the Plan entries a member ticks. Pure; the builder page does the reading and writing.
import { clampRange } from "../plan/roll.ts";
import type { RecipeEntry } from "../data/menu.ts";
import type { StoredRecipe } from "../data/recipes.ts";
import { addDays, toDateKey } from "../plan/week.ts";
import type { SourceLine } from "./types.ts";

/**
 * The range the builder opens with, for the week that was on the Plan: from today to that week's
 * Sunday, or the whole week if it's already over. At most 28 days, keeping the Sunday.
 */
export function defaultRange(today: Date, monday: Date): { first: string; last: string } {
  const last = toDateKey(addDays(monday, 6));
  const todayKey = toDateKey(today);
  const first = last < todayKey ? toDateKey(monday) : todayKey;
  return clampRange(first, last, "last");
}

/** A ticked Plan entry and its recipe. */
export interface PickedEntry {
  entry: RecipeEntry;
  recipe: StoredRecipe;
}

/**
 * The source lines for the picked entries: every ingredient line (not section headers), with the
 * entry's scale, the recipe's title and the entry's ID. Entries already on the list are left out,
 * so adding to a list never doubles a meal; `skipped` says how many.
 */
export function linesFor(
  picked: PickedEntry[],
  onList: SourceLine[],
): { lines: Omit<SourceLine, "id">[]; skipped: number } {
  const listed = new Set(onList.map((line) => line.entryId));
  const fresh = picked.filter(({ entry }) => !listed.has(entry.id));
  const lines = fresh.flatMap(({ entry, recipe }) =>
    recipe.ingredients
      .filter((line) => "raw" in line)
      .map((line) => ({
        raw: line.raw,
        scale: entry.scale ?? 1,
        recipeId: recipe.id,
        title: recipe.title,
        entryId: entry.id,
      })),
  );
  return { lines, skipped: picked.length - fresh.length };
}
