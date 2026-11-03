/** A section header inside the ingredient or instruction list, e.g. `[For the sauce]`. */
export interface SectionHeader {
  header: string;
}

/**
 * One ingredient line. `raw` is the source of truth (ADR-0005); the other fields are filled in by
 * the ingredient line parser (US-2.2) and may be missing.
 */
export interface Ingredient {
  raw: string;
  qty?: number;
  qtyMax?: number;
  unit?: string;
  item?: string;
}

export type IngredientLine = Ingredient | SectionHeader;

export interface Step {
  text: string;
}

export type InstructionLine = Step | SectionHeader;

/** The parsed text content of a recipe: everything except its ID, images and timestamps. */
export interface RecipeDraft {
  title: string;
  description: string;
  source: string;
  sourceUrl: string;
  yield: string;
  activeTime: string;
  totalTime: string;
  tags: string[];
  ingredients: IngredientLine[];
  instructions: InstructionLine[];
}
