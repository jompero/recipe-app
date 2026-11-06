// The merge key (GLOSSARY.md): an ingredient name cleaned up so that lines for the same thing to
// buy match across recipes (US-6.1). Conservative on purpose: prep words such as "chopped" stay,
// because a wrong merge buys the wrong thing, while a missed merge only shows two lines.

/** Words that end in "s" but aren't plurals, or whose plural the rules below get wrong. */
const NOT_PLURAL = new Set(["hummus", "couscous", "asparagus", "molasses", "swiss"]);
const IRREGULAR: Record<string, string> = { leaves: "leaf", loaves: "loaf", cookies: "cookie" };

/** A plural word made singular with a few rules; good enough for matching, not for display. */
function singular(word: string): string {
  if (NOT_PLURAL.has(word)) return word;
  const irregular = IRREGULAR[word];
  if (irregular) return irregular;
  if (/ies$/.test(word)) return word.replace(/ies$/, "y");
  if (/oes$/.test(word)) return word.replace(/es$/, "");
  if (/(ch|sh|ss|x)es$/.test(word)) return word.replace(/es$/, "");
  if (/[^s]s$/.test(word)) return word.slice(0, -1);
  return word;
}

/**
 * The item as a name to show: no brackets, no comma tail, no footnote stars, no leading "of".
 * Case is kept.
 */
export function cleanName(item: string): string {
  return item
    .replace(/\([^)]*\)/g, " ")
    .replace(/,.*$/, "")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^of\s+/i, "");
}

/** The clean name, lowercase, with its last word singular: the key before synonyms. */
function baseKey(item: string): string {
  const words = cleanName(item).toLowerCase().split(" ");
  const last = words.pop() ?? "";
  return [...words, singular(last)].join(" ");
}

/** The item's name for matching: the clean name, lowercase, last word singular, then synonyms. */
export function mergeKey(item: string): string {
  const key = baseKey(item);
  return SYNONYMS[key]?.key ?? key;
}

/**
 * The unit a name implies when the line has none: "1 garlic clove" is one clove, so it adds up
 * with "2 cloves garlic".
 */
export function impliedUnit(item: string): string | undefined {
  return SYNONYMS[baseKey(item)]?.unit;
}

const GARLIC_CLOVE = { key: "garlic", unit: "clove" };

/**
 * Keys that name the same thing to buy, mapped to one key. Kept short: the near misses and the
 * few Danish and Finnish names seen in the recipes. Grow it when the list shows a missed merge.
 */
const SYNONYMS: Record<string, { key: string; unit?: string }> = {
  "garlic clove": GARLIC_CLOVE,
  "clove garlic": GARLIC_CLOVE,
  "cloves garlic": GARLIC_CLOVE,
  // A mistranslated Danish "fed" (clove).
  "fat garlic": GARLIC_CLOVE,
  ...Object.fromEntries(
    Object.entries({
      æg: "egg",
      sukker: "sugar",
      smør: "butter",
      hvedemel: "wheat flour",
      flour: "wheat flour",
      "all-purpose flour": "wheat flour",
      "plain flour": "wheat flour",
      "all purpose flour": "wheat flour",
      maito: "milk",
      sipuli: "onion",
      fløde: "cream",
      kerma: "cream",
      "salt & pepper": "salt and pepper",
      "salt and freshly ground pepper": "salt and pepper",
      "salt and fresh ground pepper": "salt and pepper",
      "salt and freshly grounded pepper": "salt and pepper",
      "salt and freshly ground black pepper": "salt and pepper",
    }).map(([from, key]) => [from, { key }]),
  ),
};
