/**
 * One source line on the grocery list (GLOSSARY.md): an ingredient line as it came from a recipe
 * on the Plan, or an item added by hand (no `recipeId`). `raw` is the source of truth (ADR-0005)
 * and is parsed again each time the list is shown. Stored in `grocery_lists/current` (ADR-0008).
 */
export interface SourceLine {
  id: string;
  raw: string;
  /** The Plan entry's scale (1 for 1×), applied to the amount before merging. */
  scale: number;
  recipeId?: string;
  /** The recipe's title when the list was built. */
  title?: string;
  /** The Plan entry the line came from, so building again doesn't add it twice. */
  entryId?: string;
}

/** Source lines with the same merge key, shown as one line with one combined amount. */
export interface MergedLine {
  key: string;
  name: string;
  /** The combined amount as display text, e.g. "4–5 cloves", "2 dl + 100 g", "" for none. */
  amount: string;
  sources: SourceLine[];
}
