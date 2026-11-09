# 11: Grocery aisle sections

Status: done
Story: US-10.11
Branch: `EPIC-10/US-10.11-aisles`
Spec: [../spec.md](../spec.md) (Grocery list)
Blocked by: 07

## What to build

- **Aisle table** in `src/groceries/`, next to the synonym table: merge key (or keyword) → aisle. Seed it from the ingredients in the base data, so most real items are placed.
- **Fixed order:** Produce, Bakery, Dairy, Meat & fish, Dry goods, Frozen, Other. Unknown items go to Other.
- **Merged view, all sizes:** items grouped under aisle headings in that order, A–Z within an aisle. Empty aisles are hidden. Items added by hand are placed the same way.
- The by-recipe view is unchanged. No schema or rules change.
- GLOSSARY: add **Aisle**.

## Acceptance criteria

- [x] Unit tests: the lookup (plurals and synonyms reach the same aisle), unknowns go to Other, the order of aisles.
- [x] A note in Comments on how many distinct merge keys in the base data land in Other.
- [x] Component test: the merged view shows aisle headings in order.
- [x] `npm run check` and `npm run e2e` pass.

## Comments

- **2026-11-09, built.** `src/groceries/aisles.ts`: `AISLES` (the order), `aisleOf(key)` and `groupByAisle(merged)`. The table is words and phrases as merge keys, seeded from the base data's ingredient lines (`fixtures/baseDataLines.json`), with the Danish and Finnish names seen there.
  - Lookup: the key's endings, longest first ("tin chopped tomato" → "chopped tomato", Dry goods), then single words from the end, also made singular with `mergeKey.ts`'s `singular`, now exported ("parmesan cheese shredded" → "cheese"). A key starting with "frozen" is Frozen; with "dried"/"dry", Dry goods. A phrase beats a word in it ("coconut milk" is Dry goods).
  - **Other in the base data:** 77 of 1030 distinct merge keys (7.5%), 104 of 2188 lines (4.8%). Mostly water (16 uses), serving notes ("for serving", "salad on the side?"), and one-off untranslated or run-together lines. Judgement calls: eggs in Dairy, tuna (tinned) and sweetcorn in Dry goods, peas in Frozen, tofu in Produce.
  - Merged view: an `h2` label per aisle with its own list; the by-recipe view is unchanged. GLOSSARY: **Aisle**.
  - `npm run check` (896) and `npm run e2e` pass locally.
