// Units for the grocery list (US-6.1): which amounts can add up, and how a total is shown.
// Volume and mass never convert into each other: that would need each ingredient's density.
import { friendly } from "../parsing/scale.ts";

/** Grams per unit. */
const MASS: Record<string, number> = { g: 1, kg: 1000, oz: 28.35, lb: 453.6 };
/** Millilitres per unit. A cup is the US cup; tablespoons and teaspoons are the metric 15 and 5 ml. */
const VOLUME: Record<string, number> = { tsp: 5, tbsp: 15, cup: 236.6, ml: 1, dl: 100, l: 1000 };

/** What an amount is measured in, so only like amounts add up. */
export type Kind =
  { kind: "mass" | "volume"; factor: number } | { kind: "other"; unit: string; factor: 1 };

export function kindOf(unit: string | undefined): Kind {
  const grams = unit === undefined ? undefined : MASS[unit];
  if (grams !== undefined) return { kind: "mass", factor: grams };
  const ml = unit === undefined ? undefined : VOLUME[unit];
  if (ml !== undefined) return { kind: "volume", factor: ml };
  return { kind: "other", unit: unit ?? "", factor: 1 };
}

/** A number with at most `places` decimals, trailing zeros dropped. */
function decimal(value: number, places: number): string {
  return String(Number(value.toFixed(places)));
}

/** How a total is written: its unit, the size of that unit in base units, and the number format. */
interface Tier {
  unit: string;
  size: number;
  format: (value: number) => string;
}

/** The tier for a mass or volume total, chosen by the larger end of a range. */
function tierFor(kind: "mass" | "volume", largest: number): Tier {
  if (kind === "mass") {
    if (largest >= 1000) return { unit: "kg", size: 1000, format: (v) => decimal(v, 2) };
    if (largest >= 10) return { unit: "g", size: 1, format: (v) => String(Math.round(v)) };
    return { unit: "g", size: 1, format: (v) => decimal(v, 1) };
  }
  if (largest >= 1000) return { unit: "l", size: 1000, format: (v) => decimal(v, 2) };
  return { unit: "dl", size: 100, format: (v) => decimal(v, 1) };
}

/** Below 1 dl, millilitres as tablespoons and teaspoons: [["1", "tbsp"], ["1", "tsp"]]. */
function spoons(ml: number): [string, string][] {
  let tbsp = Math.floor(ml / 15 + 0.01);
  // The leftover teaspoons to the nearest quarter, so a converted cup never shows "0.8 tsp";
  // only an amount under ¼ tsp (⅛ tsp cayenne) keeps its own fraction.
  const left = (ml - tbsp * 15) / 5;
  let tsp = friendly(left < 0.25 ? left : Math.round(left * 4) / 4, false);
  // A remainder that rounds to 3 tsp is another tablespoon.
  if (tsp === "3") {
    tbsp += 1;
    tsp = "0";
  }
  const parts: [string, string][] = [];
  if (tbsp > 0) parts.push([String(tbsp), "tbsp"]);
  if (tsp !== "0" || parts.length === 0) parts.push([tsp, "tsp"]);
  return parts;
}

const text = (parts: [string, string][]) =>
  parts.map((part) => part.filter(Boolean).join(" ")).join(" + ");

/** "a–b unit" when both ends share one unit, else "a unit – b unit". Equal ends show once. */
function range(low: [string, string][], high: [string, string][]): string {
  if (text(low) === text(high)) return text(high);
  const [lowOnly] = low;
  const [highOnly] = high;
  if (low.length === 1 && high.length === 1 && lowOnly && highOnly && lowOnly[1] === highOnly[1]) {
    return `${lowOnly[0]}–${highOnly[0]}${highOnly[1] ? ` ${highOnly[1]}` : ""}`;
  }
  return `${text(low)} – ${text(high)}`;
}

/** "clove" → "cloves", "pinch" → "pinches". The canonical units are all regular. */
function plural(unit: string): string {
  return /(ch|sh)$/.test(unit) ? `${unit}es` : `${unit}s`;
}

/**
 * A total (a range from `low` to `high`, equal when it isn't one) in the kind's base unit (grams,
 * millilitres, or a count), as display text: "654 g", "1 tbsp + 1 tsp", "4–5 cloves".
 */
export function formatTotal(kind: Kind, low: number, high = low): string {
  if (kind.kind === "volume" && high < 100) return range(spoons(low), spoons(high));
  if (kind.kind === "other") {
    const unit = kind.unit && high > 1 ? plural(kind.unit) : kind.unit;
    return range([[friendly(low, false), unit]], [[friendly(high, false), unit]]);
  }
  const tier = tierFor(kind.kind, high);
  const part = (value: number): [string, string] => [tier.format(value / tier.size), tier.unit];
  return range([part(low)], [part(high)]);
}
