// Scaling a recipe's ingredient amounts for the recipe page (US-3.4). Not saved: only the amount
// at the start of the original text is rewritten, so the line otherwise reads as written.
import { splitAmount } from "./ingredientLine.ts";
import type { Ingredient } from "./types.ts";

const METRIC = new Set(["g", "kg", "ml", "dl", "l"]);
/** Small units where a fraction of a gram or millilitre is meaningless. */
const WHOLE_NUMBER_UNITS = new Set(["g", "ml"]);
const FRACTIONS: [number, string][] = [
  [1 / 8, "⅛"],
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [1 / 2, "½"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
];
const CLOSE = 0.02;

function decimal(value: number, places: number, comma: boolean): string {
  const text = String(Number(value.toFixed(places)));
  return comma ? text.replace(".", ",") : text;
}

/** 1.5 → "1½", 0.25 → "¼"; amounts with no friendly fraction get one decimal. */
function friendly(value: number, comma: boolean): string {
  const whole = Math.floor(value);
  const part = value - whole;
  if (part < CLOSE) return String(whole);
  if (part > 1 - CLOSE) return String(whole + 1);
  const glyph = FRACTIONS.find(([fraction]) => Math.abs(part - fraction) < CLOSE)?.[1];
  if (glyph) return `${whole > 0 ? whole : ""}${glyph}`;
  return decimal(value, 1, comma);
}

function formatAmount(value: number, unit: string | undefined, comma: boolean): string {
  if (unit && WHOLE_NUMBER_UNITS.has(unit) && value >= 10) return String(Math.round(value));
  if (unit && METRIC.has(unit)) return decimal(value, 2, comma);
  return friendly(value, comma);
}

/** The line's text with its amount multiplied by `factor`; lines without an amount are unchanged. */
export function scaleIngredient(line: Ingredient, factor: number): string {
  if (factor === 1 || line.qty === undefined) return line.raw;
  const parts = splitAmount(line.raw);
  if (!parts) return line.raw;
  // Keep the recipe's own decimal separator ("0,5 dl" stays with commas).
  const comma = /,/.test(parts.amount + (parts.amountMax ?? ""));
  let amount = formatAmount(line.qty * factor, line.unit, comma);
  if (line.qtyMax !== undefined && parts.amountMax !== null) {
    const separator = /[-–]/.test(parts.separator) ? "–" : parts.separator;
    amount += separator + formatAmount(line.qtyMax * factor, line.unit, comma);
  }
  return parts.before + amount + parts.after;
}
