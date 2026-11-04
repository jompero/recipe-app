// The cookbook page's logic: which recipes to show for a search, tag filter and sort, kept in the
// URL. Pure functions, no Firebase (spec: "Search, filter, sort").
import type { StoredRecipe } from "../data/recipes.ts";

export interface CookbookState {
  /** Search text as typed. */
  q: string;
  /** Selected tag chips; a recipe needs all of them. */
  tags: string[];
  sort: "az" | "new";
  view: "grid" | "list";
  /** The Show archived view: only archived recipes. */
  archived: boolean;
}

export const DEFAULT_STATE: CookbookState = {
  q: "",
  tags: [],
  sort: "az",
  view: "grid",
  archived: false,
};

/** Lowercase, accents removed: "Crème" → "creme". */
function normalise(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function matchesQuery(recipe: StoredRecipe, query: string): boolean {
  const haystacks = [
    recipe.title,
    ...recipe.tags,
    ...recipe.ingredients.flatMap((line) => ("raw" in line ? [line.raw] : [])),
  ];
  return haystacks.some((text) => normalise(text).includes(query));
}

const byTitle = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

/**
 * The recipes to show, in order. Newest-first ties (imported recipes share a date) fall back to A–Z.
 */
export function selectRecipes(recipes: StoredRecipe[], state: CookbookState): StoredRecipe[] {
  const query = normalise(state.q.trim());
  const shown = recipes.filter(
    (recipe) =>
      recipe.archived === state.archived &&
      state.tags.every((tag) => recipe.tags.includes(tag)) &&
      (!query || matchesQuery(recipe, query)),
  );
  return shown.sort(
    (a, b) =>
      (state.sort === "new" ? b.createdAt.getTime() - a.createdAt.getTime() : 0) ||
      byTitle.compare(a.title, b.title),
  );
}

/** The tag chips: every tag in use in the view (active or archived), most used first. */
export function tagChips(recipes: StoredRecipe[], archived: boolean): string[] {
  const counts = new Map<string, number>();
  for (const recipe of recipes) {
    if (recipe.archived !== archived) continue;
    for (const tag of recipe.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([tagA, countA], [tagB, countB]) => countB - countA || byTitle.compare(tagA, tagB))
    .map(([tag]) => tag);
}

/** The cookbook state in a URL query (`?q=…&tags=a,b&sort=new&view=list&archived=1`). */
export function readCookbookState(params: URLSearchParams): CookbookState {
  return {
    q: params.get("q") ?? "",
    tags: (params.get("tags") ?? "").split(",").filter(Boolean),
    sort: params.get("sort") === "new" ? "new" : "az",
    view: params.get("view") === "list" ? "list" : "grid",
    archived: params.get("archived") === "1",
  };
}

/** The URL query for a cookbook state, leaving out defaults: "" for the plain cookbook. */
export function cookbookSearch(state: CookbookState): string {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.tags.length > 0) params.set("tags", state.tags.join(","));
  if (state.sort !== "az") params.set("sort", state.sort);
  if (state.view !== "grid") params.set("view", state.view);
  if (state.archived) params.set("archived", "1");
  const query = params.toString().replaceAll("%2C", ",");
  return query ? `?${query}` : "";
}

export interface LetterGroup {
  /** "A"…"Z", "#" for titles not starting with a letter, or null when not sorted A–Z. */
  letter: string | null;
  recipes: StoredRecipe[];
}

/** Splits already-sorted recipes into the list view's letter sections (A–Z sort only). */
export function letterGroups(sorted: StoredRecipe[], sort: CookbookState["sort"]): LetterGroup[] {
  if (sort !== "az") return [{ letter: null, recipes: sorted }];
  const groups: LetterGroup[] = [];
  for (const recipe of sorted) {
    const first = normalise(recipe.title.trim()).charAt(0).toUpperCase();
    const letter = /\p{L}/u.test(first) ? first : "#";
    const last = groups.at(-1);
    if (last?.letter === letter) last.recipes.push(recipe);
    else groups.push({ letter, recipes: [recipe] });
  }
  return groups;
}
