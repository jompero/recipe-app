# 01: Parser fixes, and the merge and convert logic

Status: ready-for-agent
Story: US-6.1
Branch: `EPIC-6/US-6.1-merge-logic`
Spec: [../spec.md](../spec.md) (Parser fixes, Merge and convert logic)
Blocked by: none

## Touches

- `src/parsing/ingredientLine.ts` (+ tests)
- `src/parsing/scale.ts`, **only** to export (or move to a shared module) the friendly-number formatting
- New: `src/groceries/` (the source line type, merge keys, synonyms, unit conversion, totals and display, the merged and by-recipe views), each with unit tests
- Test fixtures copied from `.scratch/base-data/recipes-export.json` if needed (ingredient lines only, no personal data)

If you need to change anything else, stop and ask.

## What to build

Build it **test-first** (the `tdd` skill). Pure functions only: no Firebase, no React.

- **Parser:** drop a leading "of" after a unit; add `kpl` and `stk` (piece), `tlk` (can), and `pkt`/`packet`/`pack` (canonical `packet`).
- **Source line type:** `{ id, raw, scale, recipeId?, title?, entryId? }`, in `src/groceries/`; 03 imports it.
- **Merge key:** lowercase, brackets and comma tail dropped, leading "of" dropped, the plural rules with exceptions, then the synonym table. Prep words stay.
- **Units:** volume (tsp, tbsp, cup = US cup, ml, dl, l), mass (g, kg, oz, lb), counted (everything else, and no unit). Never volume to mass or back.
- **Totals and display:** g/kg; tbsp/tsp below 1 dl, then dl, then l; counted only with the same unit; ranges added end to end; "+ some" when a name mixes lines with and without amounts; scale applied first.
- **Views:** `mergeLines(lines)` gives merged lines A–Z with their sources; `groupByRecipe(lines)` gives groups in build order, hand-added last.

## Acceptance criteria

- [ ] Unit tests for every rule in the spec's Testing Decisions (01), and the existing parser tests still pass.
- [ ] A test over a large fixture from the base data: every source line lands in exactly one merged line, and there are fewer merged lines than source lines.
- [ ] A comment in this issue listing the merged lines for one real week (the owner picks the recipes) and any obvious missed merges, so the synonym table can be judged.
- [ ] `npm run typecheck`, `npm run lint` and the unit tests pass (no emulator needed).
