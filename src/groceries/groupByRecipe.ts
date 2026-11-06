// The grocery list's "by recipe" view (US-6.1): source lines grouped by the Plan entry they came
// from, unmerged, in the order they were added. Lines added by hand come last, in one group.
import type { SourceLine } from "./types.ts";

/** One recipe on the list (from one Plan entry), or the hand-added lines (no `entryId`). */
export interface RecipeGroup {
  entryId?: string;
  recipeId?: string;
  title?: string;
  scale?: number;
  lines: SourceLine[];
}

export function groupByRecipe(lines: SourceLine[]): RecipeGroup[] {
  const groups = new Map<string, RecipeGroup>();
  const byHand: SourceLine[] = [];
  for (const line of lines) {
    if (line.entryId === undefined) {
      byHand.push(line);
      continue;
    }
    const group = groups.get(line.entryId) ?? {
      entryId: line.entryId,
      recipeId: line.recipeId,
      title: line.title,
      scale: line.scale,
      lines: [],
    };
    group.lines.push(line);
    groups.set(line.entryId, group);
  }
  return [...groups.values(), ...(byHand.length > 0 ? [{ lines: byHand }] : [])];
}
