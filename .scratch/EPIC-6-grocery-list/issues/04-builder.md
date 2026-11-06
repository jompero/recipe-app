# 04: The builder page

Status: ready-for-agent
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

- [ ] Component tests: the default range (the current week and a past week); notes left out; unticking a recipe leaves out its lines; the scale is carried onto the lines; headers skipped; Replace calls `replaceList`; Add calls `addLines` without entries already on the list and reports the skipped count; the 28-day limit.
- [ ] By hand (owner): build a list from a real week on the phone.
- [ ] `npm run check` passes.
