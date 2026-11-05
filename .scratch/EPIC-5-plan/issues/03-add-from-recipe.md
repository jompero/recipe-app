# 03: "Add to plan…" from the recipe page

Status: in-review
Story: US-5.3
Branch: `EPIC-5/US-5.3-add-from-recipe`
Spec: [../spec.md](../spec.md) ("Add to plan…")
Blocked by: 02

## Touches

- `src/components/RecipePage.tsx` (+ tests)

If you need to change anything else, stop and ask.

## What to build

- **Add to plan…** in the recipe page's overlay menu, for archived recipes too. It opens the shared date picker from 02, starting on today.
- Picking a date calls `addEntry` with this recipe and shows "Added to Tue 4 Nov" with a link to that week (`#/plan?week=…`).

## Acceptance criteria

- [x] Component tests: the action is listed, archived recipes included; picking a date adds the recipe to that date; the confirmation links to the right week.
- [x] `npm run check` passes.

## Comments

- 2026-11-05 (agent): Built on `EPIC-5/US-5.3-add-from-recipe`. The recipe menu reads Edit recipe, **Add to plan…**, Archive/Unarchive (`useArchive` now returns its action instead of setting the menu itself). The picker is `PlanDatePicker` from 02, titled "Add to plan", opening on this month. The write isn't awaited (as on the Plan). The notice is a Mantine `Notification` fixed above the menu button, so it's seen wherever the page is scrolled: "Added to Fri 20 Nov. Show the week" (link to `#/plan?week=<Monday>`). It closes by itself after 6 s or with its close button. A failed write replaces it with "Couldn't add to the plan" and the reason, which stays until closed. `npm run check` passes (605 tests).
