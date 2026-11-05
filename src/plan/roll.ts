// The roller (US-5.4): random recipes for a range of Plan days. Pure functions, no Firebase; the
// random source is passed in so tests are deterministic.
import type { PlanDays } from "../data/menu.ts";
import type { StoredRecipe } from "../data/recipes.ts";
import { addDays, parseDateKey, toDateKey } from "./week.ts";

/** The longest range a roll can cover, in days. */
export const MAX_ROLL_DAYS = 28;

/** How far before and after the range a planned recipe keeps it out of the roll, in days. */
export const NO_REPEAT_DAYS = 14;

/**
 * A day in a roll. Rolled days change on the next roll, Locked days keep their recipe, Skipped
 * days get nothing when the roll is saved.
 */
export type RollDayState = "rolled" | "locked" | "skipped";

export interface RollRow {
  date: string;
  state: RollDayState;
  /** The suggested recipe, or null if there was nothing to pick from. */
  recipeId: string | null;
}

/** An unsaved roll: what the roller page shows and keeps in sessionStorage. */
export interface Roll {
  first: string;
  last: string;
  /** Selected tags; a recipe needs any of them. None selected: every recipe. */
  tags: string[];
  rows: RollRow[];
}

/** Every date key from `first` to `last`, both included. */
export function datesBetween(first: string, last: string): string[] {
  const start = parseDateKey(first);
  const end = parseDateKey(last);
  if (!start || !end || last < first) return [];
  const dates: string[] = [];
  for (let day = start; toDateKey(day) <= last; day = addDays(day, 1)) dates.push(toDateKey(day));
  return dates;
}

/**
 * The range after one end changes, kept to at most MAX_ROLL_DAYS: the other end moves to make it
 * fit (and to keep `first` on or before `last`).
 */
export function clampRange(
  first: string,
  last: string,
  changed: "first" | "last",
): { first: string; last: string } {
  const span = (from: string, days: number) => toDateKey(addDays(parseDateKey(from)!, days));
  if (changed === "first") {
    if (last < first) return { first, last: first };
    if (datesBetween(first, last).length > MAX_ROLL_DAYS) {
      return { first, last: span(first, MAX_ROLL_DAYS - 1) };
    }
  } else {
    if (last < first) return { first: last, last };
    if (datesBetween(first, last).length > MAX_ROLL_DAYS) {
      return { first: span(last, -(MAX_ROLL_DAYS - 1)), last };
    }
  }
  return { first, last };
}

/** The recipes a roll picks from: not archived, and with any of the tags (or all, with none). */
export function rollPool(recipes: StoredRecipe[], tags: string[]): string[] {
  return recipes
    .filter(
      (recipe) =>
        !recipe.archived && (tags.length === 0 || tags.some((tag) => recipe.tags.includes(tag))),
    )
    .map((recipe) => recipe.id);
}

/** The dates whose Plan days count for the no-repeat rule: the range, ±NO_REPEAT_DAYS. */
export function noRepeatWindow(first: string, last: string): { first: string; last: string } {
  return {
    first: toDateKey(addDays(parseDateKey(first)!, -NO_REPEAT_DAYS)),
    last: toDateKey(addDays(parseDateKey(last)!, NO_REPEAT_DAYS)),
  };
}

/** The recipes already planned on any of the given days. */
export function plannedRecipes(days: PlanDays): Set<string> {
  const planned = new Set<string>();
  for (const entries of Object.values(days)) {
    for (const entry of entries) if ("recipeId" in entry) planned.add(entry.recipeId);
  }
  return planned;
}

/**
 * New picks for the rows that `shouldRoll` chooses; the others stay as they are. A recipe is never
 * picked twice in one roll (Locked days' recipes count), nor if it's in `planned`. When nothing is
 * left, those rules relax in turn: first allow planned recipes, then repeats. An empty pool leaves
 * the rolled days empty.
 */
export function rollRows(
  rows: RollRow[],
  pool: string[],
  planned: Set<string>,
  random: () => number,
  shouldRoll: (row: RollRow) => boolean = (row) => row.state === "rolled",
): RollRow[] {
  const rolling = rows.map(shouldRoll);
  // Days that keep their recipe (Locked, or Rolled days not being rolled now) count as picked.
  const taken = new Set(
    rows.flatMap((row, i) =>
      !rolling[i] && row.state !== "skipped" && row.recipeId ? [row.recipeId] : [],
    ),
  );
  return rows.map((row, i) => {
    if (!rolling[i]) return row;
    const tiers = [
      pool.filter((id) => !taken.has(id) && !planned.has(id)),
      pool.filter((id) => !taken.has(id)),
      pool,
    ];
    const candidates = tiers.find((tier) => tier.length > 0) ?? [];
    const recipeId = candidates[Math.floor(random() * candidates.length)] ?? null;
    if (recipeId) taken.add(recipeId);
    return { ...row, recipeId };
  });
}

/** The rows for a new range: days already in the roll keep their row; new days start empty. */
export function rowsForRange(rows: RollRow[], first: string, last: string): RollRow[] {
  const byDate = new Map(rows.map((row) => [row.date, row]));
  return datesBetween(first, last).map(
    (date) => byDate.get(date) ?? { date, state: "rolled", recipeId: null },
  );
}

/** What saving the roll adds: one recipe per Rolled or Locked day. */
export function rollAdditions(rows: RollRow[]): { date: string; recipeId: string }[] {
  return rows.flatMap((row) =>
    row.state !== "skipped" && row.recipeId ? [{ date: row.date, recipeId: row.recipeId }] : [],
  );
}

const STORED_VERSION = 1;

/** The roll as text for sessionStorage. */
export function encodeRoll(roll: Roll): string {
  return JSON.stringify({ version: STORED_VERSION, ...roll });
}

const isString = (value: unknown): value is string => typeof value === "string";

function isRow(value: unknown): value is RollRow {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    isString(row["date"]) &&
    parseDateKey(row["date"]) !== null &&
    (row["state"] === "rolled" || row["state"] === "locked" || row["state"] === "skipped") &&
    (row["recipeId"] === null || isString(row["recipeId"]))
  );
}

/** A roll read back from sessionStorage, or null if it's missing, damaged or from another version. */
export function decodeRoll(text: string | null): Roll | null {
  if (text === null) return null;
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const stored = data as Record<string, unknown>;
  const { first, last, tags, rows } = stored;
  if (
    stored["version"] !== STORED_VERSION ||
    !isString(first) ||
    !isString(last) ||
    !Array.isArray(tags) ||
    !tags.every(isString) ||
    !Array.isArray(rows) ||
    !rows.every(isRow)
  ) {
    return null;
  }
  const dates = datesBetween(first, last);
  if (dates.length === 0 || dates.length > MAX_ROLL_DAYS) return null;
  if (rows.length !== dates.length || rows.some((row, i) => row.date !== dates[i])) return null;
  return { first, last, tags, rows };
}
