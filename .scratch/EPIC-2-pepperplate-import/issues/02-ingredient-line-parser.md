# 02: Ingredient line parser

Status: ready-for-agent
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

- [ ] Table-driven unit tests from real Pepperplate lines, covering every form above plus no-amount lines ("Salt & pepper", "pinch of salt").
- [ ] Over the real 198 files (skipped in CI), print the share of lines with a `qty`, and the unknown words that sit where a unit would be, for review.

## Comments
