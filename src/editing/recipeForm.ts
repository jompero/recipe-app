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
