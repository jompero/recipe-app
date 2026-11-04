import type { StoredRecipe } from "../data/recipes.ts";

/** A stored recipe for tests: only the title is needed; the ID is the title in kebab-case. */
export function storedRecipe(title: string, extra: Partial<StoredRecipe> = {}): StoredRecipe {
  return {
    id: title.toLowerCase().replace(/\W+/g, "-"),
    title,
    description: "",
    source: "",
    sourceUrl: "",
    yield: "",
    activeTime: "",
    totalTime: "",
    tags: [],
    ingredients: [],
    instructions: [],
    thumbnail: null,
    hasImage: false,
    archived: false,
    createdAt: new Date("2026-11-03"),
    updatedAt: new Date("2026-11-03"),
    ...extra,
  };
}
