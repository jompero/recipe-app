# EPIC-6: Grocery List

Status: ready-for-agent

Replaces the Epic 6 placeholder in `docs/backlog.md`. Settled in a grilling session on 2026-11-06. Terms (Grocery list, Source line, Merged line, Scale) are defined in `GLOSSARY.md`; the storage decision is [ADR-0008](../../docs/adr/0008-grocery-list-one-shared-document.md), and the Plan entry's new `scale` is an amendment to [ADR-0006](../../docs/adr/0006-menu-one-document-per-date.md).

## Problem Statement

Before shopping, someone reads every planned recipe and writes down what to buy, adding up the milk from three recipes by hand, in mixed units (cups, dl, tbsp, grams). Members want the app to build one shopping list from the Plan, tick things off in the shop, and share the list so two people can split the shopping.

## Solution

From the Plan, **Grocery list** opens a **builder** (`#/groceries/new`): pick a date range, untick any planned recipe you don't need to shop for, and build. The result is saved as the one shared **grocery list** (`#/groceries`, also in the overlay menu). The list is a **snapshot**: it keeps the ingredient lines it was built from and doesn't change when the Plan changes later.

The list page has two views: **merged** (ingredients from every recipe combined, units converted, A–Z) and **by recipe** (each recipe's own lines). Ticks sync live between members. Members can add their own items ("toilet paper", "2 dl cream"), remove lines or a whole recipe, and clear the list.

Plan entries get a **scale** (½×, 1×, 2×, 3×), set on the Plan, which the builder applies to that recipe's amounts.

## Build order and parallel work

| Issue | Story | Blocked by |
|---|---|---|
| 01 Parser fixes, and the merge and convert logic | US-6.1 | none |
| 02 Scale on Plan entries | US-6.2 | none |
| 03 Grocery list data module, rules and backup | US-6.3 | none |
| 04 The builder page | US-6.4 | 01, 02, 03 |
| 05 The list page and the tick sync test | US-6.5 | 01, 03 (04 for the e2e test, which builds a list in the UI) |

01, 02 and 03 can be built in parallel. **The emulator can't be shared** (fixed ports 8080, 9099), so only one worktree at a time, and not while the owner runs `dev:all`, may run `npm run check`, the emulator tests or Playwright. The others run `npx vitest run <their files>`, `npm run typecheck` and `npm run lint`, and leave the full check to CI. 01 is pure logic with no emulator.

## User Stories

1. As a member, I want to build a shopping list from the Plan for a range of days, so that I don't copy ingredients by hand.
2. As a member, I want to leave out planned recipes I already have food for, so that the list only holds what I need to buy.
3. As a member, I want the same ingredient from several recipes combined into one line with one amount, so that I buy it once.
4. As a member, I want cups, tablespoons, ounces and pounds turned into metric, so that the amounts add up and match the packets in the shop.
5. As a member, I want lines without an amount ("salt", "oil for frying") kept on the list, so that nothing is forgotten.
6. As a member, I want to see which recipes a combined line came from, so that I can tell when a merge went wrong.
7. As a member, I want to see the list grouped by recipe too, so that I can shop for one meal at a time.
8. As a member, I want to tick things off as I shop, and see the ticks other members make, so that two of us can split the shopping.
9. As a member, I want ticking to work with a weak signal in the shop, so that the list doesn't stall.
10. As a member, I want to add my own items to the list, so that non-recipe things are on it too.
11. As a member, I want to remove a line or a whole recipe from the list, so that I can fix it without building it again.
12. As a member, I want to add a few days to the list, or start a new one, so that the list fits how we shop.
13. As a member, I want to double or halve a planned meal, so that the list buys enough for guests or less for a quiet night.

## Implementation Decisions

### Parser fixes (US-6.1)

- `src/parsing/ingredientLine.ts`:
  - After a unit, a leading "of" is not part of the item: "2 cloves of garlic" → unit `clove`, item "garlic". 125 lines in the base data have this.
  - Add the Nordic count spellings `kpl`, `stk` (pieces) and `tlk` (can), and `pkt` (packet; add `packet`/`packets`/`pack`/`packs` as the canonical `packet`). None appear after an amount in the base data today; this is for pasted recipes.
- The stored parsed fields on recipes are **not** migrated. The grocery code parses `raw` itself (below), and a recipe's stored fields catch up the next time it's saved.

### Merge and convert logic (US-6.1)

Pure functions in a new `src/groceries/` folder, with no Firebase and no React, unit tested test-first.

- **Input:** a list of **source lines**, each `{ id, raw, scale, recipeId?, title? }` (see the data shape below). Section headers never become source lines.
- **Parsing:** each `raw` goes through `parseIngredientLine` at display time. Stored `qty`/`unit`/`item` on recipes are ignored: `raw` is the source of truth (ADR-0005) and nobody can correct the parsed fields by hand, so parsing again means a parser fix applies to every list at once.
- **Scale:** `qty` and `qtyMax` are multiplied by the line's `scale` before merging.
- **Matching names** (the **merge key**), conservative on purpose:
  - lowercase and trim; collapse whitespace;
  - drop anything in brackets, then anything after the first comma;
  - drop a leading "of";
  - plural to singular with a few rules: `-ies` → `-y`, `-oes` → `-o` (tomatoes, potatoes), `-ches`/`-shes`/`-sses`/`-xes` → drop `-es`, otherwise one trailing `-s` (not after `-ss`). A short list of words left alone (e.g. "hummus", "couscous", "asparagus", "molasses", "swiss");
  - then a small **synonym table** in code, from merge key to merge key: e.g. "garlic clove" → "garlic", "clove garlic" → "garlic", "fat garlic" → "garlic" (a mistranslated Danish "fed"), "æg" → "egg", "sukker" → "sugar", "smør" → "butter", "hvedemel" → "wheat flour", "maito" → "milk", "sipuli" → "onion", "fløde" → "cream", "kerma" → "cream". Start from the cross-language pairs and near-misses seen in the base data; keep it short.
  - **Prep and size words stay** ("finely chopped onion" ≠ "onion"; "chopped tomatoes" ≠ "tomatoes"): a wrong merge buys the wrong thing, a missed merge only shows two lines.
  - The merged line's **display name** is the most common original item text among its sources (after dropping brackets and the comma tail), tie broken by the first seen.
- **Units:** three kinds.
  - **Volume:** tsp 5 ml, tbsp 15 ml, cup 236.6 ml (US cup), ml, dl 100 ml, l 1000 ml.
  - **Mass:** g, kg 1000 g, oz 28.35 g, lb 453.6 g.
  - **Counted:** every other unit (clove, can, slice, handful, pinch, bunch, sprig, stalk, head, piece, bag, packet), and amounts with no unit (2 eggs). These add up only with the same unit (or both no unit).
  - Volume never converts to mass or back (that needs each ingredient's density). A name with amounts of two kinds shows both: "2 dl + 100 g".
- **Totals and display:**
  - Mass: g below 1000 g, else kg (one or two decimals, trailing zeros dropped).
  - Volume: below 1 dl as tbsp and tsp (e.g. "2 tbsp", "1 tbsp + 1 tsp", "½ tsp"), from 1 dl as dl, from 1 l as l. Round to friendly steps (reuse the fraction glyphs and rounding from `src/parsing/scale.ts`, which may be exported or moved for this).
  - Counted: the number and the unit, e.g. "3 cloves"; with no unit, the number alone. The name and the amount are shown side by side ("garlic · 3 cloves", "egg · 5"), so no plural is needed.
  - **Ranges:** low ends add up and high ends add up ("1–2 cloves" + "3 cloves" = "4–5 cloves"). A line with no `qtyMax` counts its `qty` as both ends.
  - **No amount:** if every source of a name has no amount, the merged line has no amount. If some do, the amount shows "+ some" ("200 g + some").
  - Nothing is ever dropped: every source line ends up in exactly one merged line.
- **Output:** merged lines `{ key, name, amount (display text), sources: SourceLine[] }`, sorted A–Z by merge key. A function for the by-recipe view groups source lines by recipe (in the order they were added), with hand-added lines in a last group.
- The functions take the source lines and return plain data; the list page only renders them.

### Scale on Plan entries (US-6.2)

- A recipe entry may carry `scale`: one of `0.5`, `2`, `3`. A 1× entry has **no** `scale` field, so existing documents need no change. Notes never have one.
- `MenuEntry` in `src/data/menu.ts` becomes `{ id, recipeId, scale? } | { id, note }`; `isEntry` accepts and checks `scale`. The rules can't check list items (see Epic 5), so the data module guards it.
- **Changing the scale:** a new `setEntryScale(date, entry, scale)` in `src/data/menu.ts`. Entries are objects in an array, so it's one `writeBatch` that removes the old entry object and adds the new one with the same `id` (verify that two updates to the same document in one batch apply in order). **This moves the entry to the end of its day**, the same as Move to… onto the same day would. Accepted: days rarely hold more than two entries.
- **Moving** an entry keeps its scale.
- **Plan page:** each recipe entry shows its scale when it isn't 1× (e.g. a small "2×" badge), and the entry's "…" menu gets **Scale** with ½× / 1× / 2× / 3× (the current one marked). Not awaited, like the other Plan writes.
- Not in this epic: setting the scale from "Add to plan…", the roller, or the builder. Opening a recipe from the Plan does not apply the entry's scale on the recipe page.
- `docs/adr/0006` is amended with `scale`.

### Grocery list data (US-6.3)

- One document, `grocery_lists/current` ([ADR-0008](../../docs/adr/0008-grocery-list-one-shared-document.md)). Shape:

  ```jsonc
  // grocery_lists/current
  {
    "lines": [
      // from a recipe: the Plan entry it came from, the recipe's id and its title at build time
      { "id": "a8k2pq", "raw": "1 cup milk", "scale": 2, "recipeId": "pancakes", "title": "Pancakes", "entryId": "k3f9x2" },
      // added by hand
      { "id": "z0m4tt", "raw": "toilet paper", "scale": 1 }
    ],
    "ticked": ["a8k2pq"],
    "updatedAt": <serverTimestamp>
  }
  ```

- `title` is copied at build time, so the list still reads right if a recipe is renamed or archived. Each line has a random `id` made in the browser, like Plan entries.
- **Writes**, all in a new `src/data/groceries.ts`; none use a transaction, so all work offline:
  - **Build, replace:** `setDoc` with the new `lines`, `ticked: []`.
  - **Build, add:** `setDoc(…, { lines: arrayUnion(...newLines), updatedAt }, { merge: true })`. Before writing, the builder leaves out Plan entries whose `entryId` is already on the list, so nothing doubles.
  - **Tick / untick:** `updateDoc` with `ticked: arrayUnion(id)` or `arrayRemove(id)`. Two members ticking at once don't overwrite each other.
  - **Add by hand:** `arrayUnion` of one new line with `scale: 1`. Trimmed, 1–80 characters (as notes).
  - **Remove a line / a recipe:** `arrayRemove` of the exact line objects from the live snapshot (all of a recipe's lines in one update, matched by `entryId`), and their ids from `ticked`.
  - **Clear:** `setDoc` with `lines: []`, `ticked: []`.
- **Reads:** `onSnapshot` on the one document. A missing document means an empty list.
- **Rules:** a new `match /grocery_lists/{listId}`: members may read; members may create and update only `current`, with keys only `lines`, `ticked` and `updatedAt`; `lines` a list of at most 600, `ticked` a list of at most 600, `updatedAt` a timestamp. Members may not delete. As with recipe ingredients, the data module guards each line's shape. (A one-week list from the base data is around 50–100 lines; 600 lines stays far under the 1 MiB document limit.)
- **Backup:** the grocery list is **not** exported or restored. It's a short-lived shopping list, and a restore shouldn't bring back an old one.
- **Writes aren't awaited** (as in the Plan): the write promise only settles when the server confirms, which never happens offline. A failure shows a short "Couldn't save the change" message on the list page.

### Builder page (US-6.4)

- Route `#/groceries/new`. Reached from **Grocery list** in the Plan page's overlay menu, which passes the week on screen.
- **Range:** start and end dates with the shared month calendar (`PlanDatePicker`). Default: today to the Sunday of the week that was on screen (if that week is wholly in the past, its Monday to Sunday). At most 28 days, like the roller.
- **Recipes:** the recipe entries in the range, read live with `watchDays`, listed by date with the recipe title, its scale when not 1×, and a checkbox (all ticked at first). Notes aren't shown. An archived recipe is listed and included, with its "archived" mark; a missing recipe is listed but can't be ticked.
- **Build** turns each ticked entry's recipe into source lines (every ingredient line except section headers, with the entry's `scale`, `recipeId`, `title` and `entryId`) and writes them:
  - no list or an empty list: write it;
  - a list with lines: ask **Replace** or **Add to it** (Cancel to go back). Add skips entries already on the list and says how many were skipped if any.
- Then go to `#/groceries`.
- Recipes come from `LiveRecipesProvider`, so the builder costs no extra recipe reads.

### List page (US-6.5)

- Route `#/groceries`, and **Grocery list** in the overlay menu's sections (after Plan). Empty state: "No grocery list yet" and a link to the builder.
- Header: when the list was last changed, a **Merged / By recipe** switch (the choice kept in `localStorage`), and in the overlay menu: **New list…** (the builder) and **Clear list** (with a confirmation).
- **Merged view:** merged lines A–Z, each with a checkbox, the name and the amount. **Ticked lines stay in place**, crossed out. A merged line is ticked when all its source lines are ticked, **partly ticked** (the checkbox's indeterminate state) when some are. Ticking a merged line ticks all its sources; unticking unticks them all.
  - Tapping the line (not the checkbox) expands it to show its source lines: the raw text as scaled ("2 cups milk") and the recipe title, or "Added by hand". Each source line has a remove button.
- **By recipe view:** one group per recipe on the list, in build order, headed by the title and scale, then its source lines (scaled raw text) each with a checkbox; a remove-recipe button on the group heading (with a confirmation). Hand-added lines are a last group, "Added by hand". Ticks are the same ticks as the merged view.
- **Add an item:** a text field at the bottom of both views; the line is parsed and merged by the same rules as recipe lines.
- Scaled raw text uses `scaleIngredient` from `src/parsing/scale.ts`.

## Testing Decisions

- **Unit (01, test-first):**
  - the parser: "of" after a unit, the new spellings, and no regressions in the existing parser tests;
  - merge keys: brackets, comma tails, "of", the plural rules and their exceptions, synonyms, prep words kept;
  - conversion and totals: tsp + tbsp + cup + dl add up; g + kg + oz + lb add up; volume and mass stay separate; counted units only with the same unit; display thresholds (tbsp/tsp below 1 dl, dl, l, g, kg);
  - ranges, no-amount lines, "+ some", scale applied before merging;
  - every source line lands in exactly one merged line (a property check over the base data, or a large fixture copied from it);
  - the by-recipe grouping.
- **Component** (React Testing Library, `src/data` faked):
  - the Plan entry's scale badge and Scale menu (02);
  - the builder: default range, notes left out, untick a recipe, replace vs add, skipped entries (04);
  - the list page: both views, partly ticked, ticking a merged line ticks its sources, expand to sources, remove a line and a recipe, add by hand, clear, empty state (05).
- **Emulator and rules:**
  - `setEntryScale` keeps the id and other entries; moving keeps the scale (02);
  - grocery writes: build replace and add, tick and untick from two clients both survive, remove, clear; members may read and write a valid `current`; another document id, unknown keys, too many lines, and delete are denied; non-members are denied (03).
- **End to end (05):** two browser contexts on `#/groceries` after building a list from a seeded Plan day; tick a line in one, it shows ticked in the other; add an item in the second, it appears in the first.
- **By hand (owner):** build a week's list from real recipes on a phone over the LAN dev server and read it for wrong or missed merges; tick while another device watches.

## Out of Scope

- Shop sections or aisle order.
- A pantry or "always have" list.
- Merging two lines by hand, or editing an amount on the list.
- Several lists or a history of lists.
- Converting volume to mass (densities).
- Setting the scale from "Add to plan…", the roller or the builder; applying the Plan entry's scale on the recipe page.
- Updating the list when the Plan changes after building.
- Translating ingredient names beyond the small synonym table.
- Anything offline-specific in the interface (Epic 8).

## Further Notes

- When Epic 6 is done, update `docs/backlog.md`, the "Status" section of `CLAUDE.md`, and `docs/project/blueprint.md` (the schema gains `grocery_lists` and the entry's `scale`).
- After the owner has used the list for a few weeks, look again at: missed merges (grow the synonym table), a pantry list, and shop sections.
