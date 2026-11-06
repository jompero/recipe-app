# 01: Parser fixes, and the merge and convert logic

Status: done
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

- [x] Unit tests for every rule in the spec's Testing Decisions (01), and the existing parser tests still pass.
- [x] A test over a large fixture from the base data: every source line lands in exactly one merged line, and there are fewer merged lines than source lines.
- [x] A comment in this issue listing the merged lines for one real week (the owner picks the recipes) and any obvious missed merges, so the synonym table can be judged.
- [x] `npm run typecheck`, `npm run lint` and the unit tests pass (no emulator needed).

## Comments

- 2026-11-06 (agent): Built on `EPIC-6/US-6.1-merge-logic`, test-first, through the four seams agreed with the owner: `parseIngredientLine`, `mergeKey`, `mergeLines` and `groupByRecipe`.
  - **Parser:** "of" after a unit is dropped ("2 Cloves of Garlic" → clove, "Garlic"); new units `kpl`/`stk` (piece), `tlk` (can), `pkt`/`pack`/`packet` (packet).
  - **`src/groceries/`:** `types.ts` (`SourceLine`, `MergedLine`), `mergeKey.ts` (`cleanName` for the name shown, `mergeKey` for matching, the plural rules and the synonym table), `units.ts` (kinds, conversion, display), `mergeLines.ts`, `groupByRecipe.ts`.
  - `friendly` in `src/parsing/scale.ts` is now exported (fractions for tsp and counts).
  - **Fixture:** `src/groceries/fixtures/baseDataLines.json` holds only the 2,188 raw ingredient lines from the base data, one array per recipe (no titles or other fields), because `.scratch/base-data/` is gitignored and CI can't read it.
  - **Different from the spec,** found by previewing a merged list from real recipes:
    - Sorted A–Z by the **name shown**, not the merge key: "flour" (key "wheat flour") was listed under W. Spec updated.
    - **Footnote stars** are dropped from names and keys ("chicken stock*"). Spec updated.
    - "all purpose flour" (no hyphen) added to the synonyms.
  - Ranges whose ends fall in different spoon units show both in full ("2 tsp – 1 tbsp + 1 tsp"). A range's unit for mass and volume is chosen by its high end ("0.8–1 kg").
  - Typecheck, lint and the unit tests pass (565 in the app project). No emulator needed.
  - **Left for the owner:** pick one real week of recipes for the merged-list check (last acceptance criterion). A preview from 7 arbitrary recipes (75 lines → 61 merged) looked right; missed merges seen there were all expected by the conservative rules ("pepper" / "black pepper" / "freshly grounded pepper", "finely chopped onion" / "small white onion").

- 2026-11-06 (agent, owner): **Real-week check.** The two weeks on the owner's Plan in the emulator were merged with a scratch script (no UI yet; the builder and list pages are 04 and 05):
  - **6–8 Nov** (the builder's default range; 5 recipes): 36 lines → 33 merged. Merged: garlic, olive oil, salt.
  - **9–15 Nov** (7 recipes): 95 lines → 76 merged. Merged: garlic (5 cloves from three recipes), onion, eggs, milk, minced beef (700 g), butter, bacon (4 slices + 350 g), olive oil, salt, salt and pepper.
  - No wrong merges. Three problems found, then fixed test-first:
    - **Leftover teaspoons showed as decimals** ("5 tbsp + 0.8 tsp" from ⅓ cup feta). They now round to the nearest ¼ tsp ("5 tbsp + ¾ tsp"); an amount under ¼ tsp keeps its own fraction ("⅛ tsp").
    - **"1 garlic clove" was a bare count** ("garlic · 4 cloves + 1"). A synonym can now give the unit a name implies (`impliedUnit`), so it counts as 1 clove ("garlic · 5 cloves").
    - **Salt-and-pepper spellings** stayed four lines; the synonym table now maps them to one ("salt and pepper").
  - Misses left as the conservative rules intend: "fat finely chopped garlic" (prep word in the middle), "parmesan" vs "shredded parmesan cheese", "Onions" vs "chopped onion", the different peppers.

**2026-11-06 (owner):** Real-week check passed. PR #45 merged.
