# 06: Archive

Status: done
Story: US-3.6
Branch: `EPIC-3/US-3.6-archive`
Spec: [../spec.md](../spec.md)
Blocked by: 04

## What to build

- **Data:** `archiveRecipe(id)` / `unarchiveRecipe(id)` in `src/data/recipes.ts`, setting `archived` and `updatedAt: serverTimestamp()`. Check that the update passes the shape rules (the rules may require the whole document; if so, write it whole, as in 05). Nothing deletes.
- **Recipe page overlay:** *Archive* with a confirmation, or *Unarchive* on an archived recipe. After archiving, go back to the grid.
- **Show archived** (`#/?archived=1`, from the grid's overlay): the same grid showing only archived recipes, each with an *Unarchive* button. Archived recipes never appear in the normal grid or its search.

## Acceptance criteria

- [x] Emulator tests: archive then unarchive pass the rules and update `updatedAt`; deleting is still denied.
- [x] Component tests with `src/data` faked: archive asks for confirmation and calls the data function; the archived view lists only archived recipes and unarchives; the normal grid hides them.
- [x] By hand: archive a recipe on one device and see it leave the grid on another.

## Comments

**2026-11-05 (agent):** Built test-first at the agreed seams. US-3.6 comes before US-3.5, agreed with the owner (it only needed the recipe page).

- **Data:** `setArchived(id, archived)` in `src/data/recipes.ts` is an `updateDoc` of `archived` plus `updatedAt: serverTimestamp()`. A partial update is enough: the rules validate `request.resource.data`, which is the whole document after the write. Emulator tests, with the real rules: archive then unarchive pass and move `updatedAt`, nothing else changes, and a missing recipe fails. "Deleting is still denied" was already covered in `tests/rules/firestore.rules.test.ts` (`memberCanDelete: false` for recipes and images).
- **Page actions can now run code:** `PageAction` is either `{ label, to }` or `{ label, onSelect }`. The menu closes first, then runs `onSelect`. `usePageActions` keeps the menu entries stable (keyed on labels and targets) and always calls the page's latest callback.
- **Recipe page:** the menu offers *Archive*, which asks "Archive this recipe?" (Cancel / Archive; confirming saves and returns to `#/`). On an archived recipe it offers *Unarchive* instead (no confirmation) and shows an "Archived" label above the title. A failed save shows an alert.
- **Show archived** (`#/?archived=1`): titled "Archived", it shows only archived recipes in the grid or the list, each with an *Unarchive* button next to its link (not inside it). Its menu has no page actions. The normal cookbook and search never show archived recipes (`selectRecipes`, since 03).
- Not done: an empty archive shows the generic "No recipes match / Clear filters".

**2026-11-05 (owner):** by-hand check passed. Design note: in the menu, "Archive" / "Unarchive" gave no hint of which recipe they act on (the cookbook's actions had the same issue, less so). Wanted one consistent pattern that shows the current page in the menu.

**2026-11-05 (agent):** the menu now names the page you're on at the top, in italic serif (the recipe's title, *Cookbook*, *Archived*, *Data*, *Account*), with that page's actions beneath it. The owner chose the name alone, without a "You're on" label and without marking the current section. `usePageActions` became `usePageMenu(title, actions?)` in `src/components/pageMenu.ts`; Data and Account now call it too.
