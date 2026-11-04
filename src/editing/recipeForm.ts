// The edit form's values and how they map to and from a recipe (US-3.5). The ingredient and
// instruction lists are edited as Pepperplate-style text (one line per item, [Header] lines),
// converted by the Epic 2 parsers, so saving recalculates amounts and units.
import {
  ingredientsToText,
  instructionsToText,
  textToIngredients,
  textToInstructions,
} from "../parsing/blockText.ts";
import type { RecipeDraft } from "../parsing/types.ts";

export interface RecipeForm {
  title: string;
  description: string;
  source: string;
  sourceUrl: string;
  yield: string;
  activeTime: string;
  totalTime: string;
  tags: string[];
  /** One ingredient per line, `[Header]` lines for sections. */
  ingredients: string;
  /** One step per line, `[Header]` lines for sections. */
  instructions: string;
}

export const EMPTY_FORM: RecipeForm = {
  title: "",
  description: "",
  source: "",
  sourceUrl: "",
  yield: "",
  activeTime: "",
  totalTime: "",
  tags: [],
  ingredients: "",
  instructions: "",
};

export function formFromRecipe(recipe: RecipeDraft): RecipeForm {
  return {
    title: recipe.title,
    description: recipe.description,
    source: recipe.source,
    sourceUrl: recipe.sourceUrl,
    yield: recipe.yield,
    activeTime: recipe.activeTime,
    totalTime: recipe.totalTime,
    tags: [...recipe.tags],
    ingredients: ingredientsToText(recipe.ingredients),
    instructions: instructionsToText(recipe.instructions),
  };
}

/** Tags as saved: lowercase, trimmed, no blanks or duplicates, in the order typed. */
function cleanTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

/** The recipe to save from the form. Check formErrors first. */
export function draftFromForm(form: RecipeForm): RecipeDraft {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    source: form.source.trim(),
    sourceUrl: form.sourceUrl.trim(),
    yield: form.yield.trim(),
    activeTime: form.activeTime.trim(),
    totalTime: form.totalTime.trim(),
    tags: cleanTags(form.tags),
    ingredients: textToIngredients(form.ingredients),
    instructions: textToInstructions(form.instructions),
  };
}

/** What stops the form from being saved, by field. Empty when it can be saved. */
export function formErrors(form: RecipeForm): Partial<Record<keyof RecipeForm, string>> {
  return form.title.trim() ? {} : { title: "A recipe needs a title" };
}

/**
 * Router state for `#/recipe/new` that opens the form filled in from a draft (Quick Paste, the
 * import route): `navigate("/recipe/new", { state })`. The form still counts as unsaved against
 * the empty form, so leaving asks to discard. The state is lost if the page reloads.
 */
export interface NewRecipeState {
  draft: RecipeDraft;
  /** An image to try to fetch as the recipe's photo (issue 06). */
  photoUrl?: string;
  /** A sessionStorage key to remove once the recipe is saved (Quick Paste's text). */
  clearOnSave?: string;
}

/** The draft passed in router state, or null when there is none. */
export function newRecipeState(state: unknown): NewRecipeState | null {
  if (typeof state !== "object" || state === null || !("draft" in state)) return null;
  const { draft } = state;
  return typeof draft === "object" && draft !== null ? (state as NewRecipeState) : null;
}
