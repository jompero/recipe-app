// Merging the grocery list's source lines into one line per thing to buy (US-6.1). Pure: the list
// page calls this on every snapshot, so a parser or synonym fix applies to the list at once.
import { parseIngredientLine } from "../parsing/ingredientLine.ts";
import { cleanName, mergeKey } from "./mergeKey.ts";
import { formatTotal, type Kind, kindOf } from "./units.ts";
import type { MergedLine, SourceLine } from "./types.ts";

interface Parsed {
  source: SourceLine;
  name: string;
  qty?: number;
  qtyMax?: number;
  unit?: string;
}

function parse(source: SourceLine): Parsed {
  const { qty, qtyMax, unit, item = "" } = parseIngredientLine(source.raw);
  return { source, name: cleanName(item), qty, qtyMax, unit };
}

function merge(key: string, group: Parsed[]): MergedLine {
  // One running total per kind, in the order the kinds were first seen.
  const totals = new Map<string, { kind: Kind; low: number; high: number }>();
  let some = false;
  for (const line of group) {
    if (line.qty === undefined) {
      some = true;
      continue;
    }
    const kind = kindOf(line.unit);
    const id = kind.kind === "other" ? `unit:${kind.unit}` : kind.kind;
    const entry = totals.get(id) ?? { kind, low: 0, high: 0 };
    const scale = line.source.scale * kind.factor;
    entry.low += line.qty * scale;
    entry.high += (line.qtyMax ?? line.qty) * scale;
    totals.set(id, entry);
  }
  return {
    key,
    name: mostCommonName(group),
    amount: [
      ...[...totals.values()].map(({ kind, low, high }) => formatTotal(kind, low, high)),
      ...(some && totals.size > 0 ? ["some"] : []),
    ].join(" + "),
    sources: group.map((line) => line.source),
  };
}

/** The name most of the lines use; on a tie, the first one seen. */
function mostCommonName(group: Parsed[]): string {
  const counts = new Map<string, number>();
  for (const line of group) counts.set(line.name, (counts.get(line.name) ?? 0) + 1);
  let best = "";
  let bestCount = 0;
  for (const [name, count] of counts) {
    if (count > bestCount) [best, bestCount] = [name, count];
  }
  return best;
}

/** One merged line per merge key, sorted A–Z by the name shown. Every source line ends up in exactly one of them. */
export function mergeLines(sources: SourceLine[]): MergedLine[] {
  const groups = new Map<string, Parsed[]>();
  for (const source of sources) {
    const parsed = parse(source);
    const key = mergeKey(parsed.name);
    groups.set(key, [...(groups.get(key) ?? []), parsed]);
  }
  return [...groups]
    .map(([key, group]) => merge(key, group))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}
