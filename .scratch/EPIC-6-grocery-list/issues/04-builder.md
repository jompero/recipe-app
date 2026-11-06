# 04: The builder page

Status: ready-for-human
Story: US-6.4
Branch: `EPIC-6/US-6.4-builder`
Spec: [../spec.md](../spec.md) (Builder page)
Blocked by: 01, 02, 03

## Touches

- New: the builder page component (+ tests)
- `src/routes.tsx` (`#/groceries/new`)
- `src/components/PlanPage.tsx`, **only** for the "Grocery list" item in its overlay menu, which passes the week on screen

If you need to change anything else, stop and ask.

## What to build

- **Range:** start and end dates with `PlanDatePicker`. Default: today to the Sunday of the week passed in (for a week wholly in the past, its Monday to Sunday). At most 28 days.
- **Recipes:** the recipe entries in the range via `watchDays`, by date, each with its title, scale badge and a checkbox (all ticked at first). Notes are hidden. Archived recipes are included, with their mark. A missing recipe is listed but can't be ticked.
- **Build:** each ticked entry's ingredient lines (not headers) become source lines with `scale`, `recipeId`, `title` and `entryId`.
  - No list, or an empty one: write it.
  - Otherwise ask Replace / Add to it / Cancel. Add skips entries already on the list and says how many it skipped.
  - Then go to `#/groceries`.
- Not awaited (like the Plan); go to the list at once.

## Acceptance criteria

- [x] Component tests: the default range (the current week and a past week); notes left out; unticking a recipe leaves out its lines; the scale is carried onto the lines; headers skipped; Replace calls `replaceList`; Add calls `addLines` without entries already on the list and reports the skipped count; the 28-day limit.
- [x] By hand (owner): build a list from a real week on the phone.
- [x] `npm run check` passes (typecheck, lint and `npm test` against the running emulator: 811 tests).

## Comments

- 2026-11-06 (agent): Built on `EPIC-6/US-6.4-builder`, test-first through the two seams agreed with the owner (the pure builder logic, the builder page with `src/data` faked).
  - **`src/groceries/build.ts`:** `defaultRange(today, monday)` (today to the week's Sunday; a past week's Monday to Sunday; at most 28 days, keeping the Sunday) and `linesFor(picked, onList)` (each ingredient line, headers left out, with the entry's scale, the recipe's title and the entry's id; entries already on the list left out and counted).
  - **`GroceryBuilderPage`** at `#/groceries/new?week=`: From and To dates, the planned recipes grouped by day with checkboxes (scale shown, archived marked, missing recipes listed but disabled, notes hidden), **Build list**. With lines already on the list it asks **Replace** / **Add to it** / Cancel. The Plan's menu has **Grocery list…**, passing the week on screen.
  - **Different from the issue:**
    - The range uses the roller's native **From/To date fields** and its `clampRange`, not `PlanDatePicker`, so both range pickers behave the same.
    - "N meals are already on it" is shown **in the Replace / Add dialog**, before choosing, rather than after leaving the page.
    - Agreed with the owner: a **stand-in `#/groceries` page** (`GroceryListPage.tsx`) shows the saved lines as written, by recipe, so the builder can be checked in the app. US-6.5 replaces it.
  - **Beyond Touches:** `useGroceryList` (a hook over `watchGroceryList`, for 05 too); `scaleLabel` moved to `src/plan/scale.ts` (shared with the Plan page); every whole-app test now fakes `src/data/groceries.ts`, as the convention in `renderApp.tsx` asks.
  - Writes aren't awaited (as on the Plan); the page goes to `#/groceries` at once.

**2026-11-06 (owner):** Manual review passed.
