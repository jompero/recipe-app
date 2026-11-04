/**
 * What the recipe bookmarklet (EPIC-4, US-4.4) sends to the app's `#/import?d=` route, as
 * base64url-encoded UTF-8 JSON. This is the contract between the bookmarklet (`src/bookmarklet/`)
 * and the converter (`src/import/jsonLd.ts`), so either can be built without the other.
 *
 * `recipe` is the page's schema.org Recipe object, trimmed to the keys below, with `@id`
 * references (image, author, publisher) inlined from the same `@graph`. Values are passed through
 * as the site wrote them, so every field may have any of the shapes schema.org and real sites use
 * (string, array, object); the converter handles them.
 */
export interface RecipePayload {
  /** Payload version, so the app can reject or adapt to an old bookmarklet. */
  v: 1;
  /** The page the recipe came from (`location.href`). */
  url: string;
  recipe: {
    name?: unknown;
    description?: unknown;
    recipeIngredient?: unknown;
    /** Legacy name for `recipeIngredient`. */
    ingredients?: unknown;
    recipeInstructions?: unknown;
    recipeYield?: unknown;
    prepTime?: unknown;
    cookTime?: unknown;
    totalTime?: unknown;
    image?: unknown;
    author?: unknown;
    publisher?: unknown;
  };
}

/** The keys of `RecipePayload.recipe`, which the bookmarklet keeps. */
export const RECIPE_PAYLOAD_KEYS = [
  "name",
  "description",
  "recipeIngredient",
  "ingredients",
  "recipeInstructions",
  "recipeYield",
  "prepTime",
  "cookTime",
  "totalTime",
  "image",
  "author",
  "publisher",
] as const satisfies readonly (keyof RecipePayload["recipe"])[];
