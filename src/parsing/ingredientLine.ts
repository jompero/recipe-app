// Splits one ingredient line into amount, unit and item (US-2.2). `raw` is always kept as the
// source of truth (ADR-0005); when the line doesn't fit, the fields are simply left out.
import type { Ingredient } from "./types.ts";

/**
 * Unit spellings found in the Pepperplate export (English, Danish, Finnish), mapped to one
 * canonical spelling. Matched lowercase and without a trailing dot.
 */
const UNIT_SPELLINGS: Record<string, string[]> = {
  tbsp: ["tbsp", "tbsps", "tbs", "tablespoon", "tablespoons", "spsk", "rkl"],
  tsp: ["tsp", "tsps", "teaspoon", "teaspoons", "tl", "tsk"],
  cup: ["cup", "cups", "c"],
  g: ["g", "gr", "gram", "grams"],
  kg: ["kg", "kilo", "kilos"],
  ml: ["ml"],
  dl: ["dl"],
  l: ["l", "liter", "liters", "litre", "litres"],
  oz: ["oz", "ounce", "ounces"],
  lb: ["lb", "lbs", "pound", "pounds"],
  clove: ["clove", "cloves"],
  slice: ["slice", "slices"],
  can: ["can", "cans"],
  handful: ["handful", "handfuls"],
  pinch: ["pinch", "pinches"],
  bunch: ["bunch", "bunches"],
  sprig: ["sprig", "sprigs"],
  stalk: ["stalk", "stalks"],
  head: ["head", "heads"],
  piece: ["piece", "pieces"],
  bag: ["bag", "bags"],
};

const UNITS = new Map(
  Object.entries(UNIT_SPELLINGS).flatMap(([unit, spellings]) =>
    spellings.map((spelling) => [spelling, unit] as const),
  ),
);

/** Case matters only here: in US recipes "T" is a tablespoon and "t" a teaspoon. */
const CASE_SENSITIVE_UNITS = new Map([
  ["T", "tbsp"],
  ["t", "tsp"],
]);

function unitOf(word: string): string | undefined {
  return CASE_SENSITIVE_UNITS.get(word) ?? UNITS.get(word.toLowerCase().replace(/\.$/, ""));
}

const UNICODE_FRACTIONS: Record<string, number> = {
  "¼": 1 / 4,
  "½": 1 / 2,
  "¾": 3 / 4,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 1 / 8,
};
const VULGAR = `[${Object.keys(UNICODE_FRACTIONS).join("")}]`;

/** One amount: "1 1/2", "1/2", "1½", "2 ½", "½", "0,5", "1.5", "400". */
const AMOUNT = `\\d+\\s+\\d+/\\d+|\\d+/\\d+|\\d+\\s*${VULGAR}|${VULGAR}|\\d+(?:[.,]\\d+)?`;

/**
 * An amount, optionally a range ("1-2", "1 –2", "1 to 2"), then the rest. The gap before the rest
 * is captured because only a unit may follow the amount without a space ("95g").
 */
const LINE = new RegExp(`^(${AMOUNT})(?:(?:\\s*[-–]\\s*|\\s+to\\s+)(${AMOUNT}))?(\\s*)(.*)$`);

/** List bullets (incl. the ▢ checkbox copied from recipe sites) and "ca." ("about", Danish). */
const PREFIX = /^(?:[•·*▢]\s*|ca\.\s+)/;

function amountValue(text: string): number {
  const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(text);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = /^(\d+)\/(\d+)$/.exec(text);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  const vulgar = new RegExp(`^(\\d*)\\s*(${VULGAR})$`).exec(text);
  if (vulgar) return Number(vulgar[1] || 0) + (UNICODE_FRACTIONS[vulgar[2] ?? ""] ?? 0);
  return Number(text.replace(",", "."));
}

export function parseIngredientLine(raw: string): Ingredient {
  const line = raw.trim().replace(PREFIX, "");
  const [, amount, amountMax, gap = "", rest = ""] = LINE.exec(line) ?? [];
  const [, firstWord = "", afterFirstWord = ""] = /^(\S+)\s+(.*)$/.exec(rest) ?? [];
  const unit = unitOf(firstWord);

  // No amount, or digits glued to something that isn't a unit ("2nd"): nothing to pull out.
  if (amount === undefined || rest === "" || (gap === "" && unit === undefined)) {
    return { raw, item: line };
  }

  const result: Ingredient = { raw, qty: amountValue(amount) };
  if (amountMax !== undefined) result.qtyMax = amountValue(amountMax);
  if (unit !== undefined) {
    result.unit = unit;
    result.item = afterFirstWord;
  } else {
    // Stray punctuation between amount and item ("20 , 9 inch rice paper") isn't part of the item.
    result.item = rest.replace(/^[,;:\-–\s]+/, "");
  }
  return result;
}
