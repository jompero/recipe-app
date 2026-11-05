# 03: "Add to plan…" from the recipe page

Status: ready-for-agent
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

- [ ] Component tests: the action is listed, archived recipes included; picking a date adds the recipe to that date; the confirmation links to the right week.
- [ ] `npm run check` passes.

## Comments
