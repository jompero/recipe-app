# 02: Ingredient line parser

Status: done
Story: US-2.2
Branch: `EPIC-2/US-2.2-ingredient-line-parser`
Spec: [../spec.md](../spec.md)
Blocked by: 01

## What to build

- A pure function in `src/parsing/`: one ingredient line → `{ raw, qty?, qtyMax?, unit?, item? }` (ADR-0005). `raw` is always the exact input.
- Amount at the start of the line: whole numbers, decimals (`1.5`, `1,5`), `3/4`, `1 1/2`, unicode fractions (`½`, `1½`), ranges `1-2` / `1–2` → `qty` + `qtyMax`.
- Known units standardised to one spelling, including trailing dots and plurals: `tbsp` (tablespoon(s), Tbsp., tbsp.), `tsp` (teaspoon(s), tsp.), `cup`, `g`, `kg`, `ml`, `dl`, `l`, `oz`, `lb`, and counts `clove`, `slice`, `can`, `handful`, `pinch`. Check the real data for the full list (2,643 lines).
- Everything after the unit is `item`, prep notes included. A line with no amount gets only `item`. A unit-looking word with no amount stays in `item`.
- The recipe parser (01) uses it for every ingredient line.

## Acceptance criteria

- [x] Table-driven unit tests from real Pepperplate lines, covering every form above plus no-amount lines ("Salt & pepper", "pinch of salt").
- [x] Over the real 198 files (skipped in CI), print the share of lines with a `qty`, and the unknown words that sit where a unit would be, for review.

## Comments

**2026-11-03 (agent):** `parseIngredientLine` in `src/parsing/ingredientLine.ts`, built test-first. `parseRecipeText` and `textToIngredients` (the edit form) now both use it.

Beyond the issue, found in the real lines:
- **More units:** Danish/Finnish `tl` / `tsk` (tsp) and `spsk` / `rkl` (tbsp), `c.` (cup), and the counts `head`, `piece`, `bag`. `T` and `t` are case-sensitive (tbsp / tsp); every other unit is matched in lowercase without a trailing dot.
- **Amounts:** `1 to 2` ranges and `1/2-1`. A number written straight against a unit (`95g`) counts, but not against anything else (`2nd`). Leading `•`, `▢` (copied from recipe sites) and `ca.` are skipped.
- **Package sizes:** only the first number is the amount. `4 5oz. cans tuna` → qty 4, item `5oz. cans tuna`, and `1 (14.5 oz) can broth` → qty 1, item `(14.5 oz) can broth`. Stray punctuation before the item is dropped (`20 , 9 inch rice paper` → item `9 inch rice paper`).
- **Real-data result** (pinned as floors in `scripts/pepperplate-corpus.test.ts`): 2,188 lines, 1,754 (80%) with an amount and 1,335 (61%) with a unit. Every line has an item. Most misses are size or colour words after the amount ("2 large eggs", "1 red onion"), which correctly stay in `item`. Lines with digits but no leading amount are mostly sub-recipe references ("Remoulade (see page 79)") and phrases like "Juice of 1 lime" / "Scant 1/2 teaspoon". Those keep only `raw` + `item`, which Epic 6 lists separately.
