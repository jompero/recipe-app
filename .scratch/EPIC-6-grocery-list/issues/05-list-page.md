# 05: The list page and the tick sync test

Status: ready-for-human
Story: US-6.5
Branch: `EPIC-6/US-6.5-list-page`
Spec: [../spec.md](../spec.md) (List page, Testing Decisions)
Blocked by: 01, 03 (and 04 for the end-to-end test)

## Touches

- New: the list page component and its parts (+ tests)
- `src/routes.tsx` (`#/groceries`), `src/components/MemberShell.tsx` ("Grocery list" in the menu's sections, after Plan)
- New: an end-to-end test in `e2e/` (ticks and added items sync between two windows)

If you need to change anything else, stop and ask.

## What to build

- **Empty state** with a link to the builder.
- **Header:** when the list last changed, and the **Merged / By recipe** switch (the choice kept in `localStorage`). The overlay menu has **New list…** and **Clear list** (with a confirmation).
- **Merged view:**
  - A–Z, from `mergeLines`.
  - Each line's checkbox is ticked, partly ticked (indeterminate) or unticked. Ticking a line ticks all its sources. Ticked lines stay in place, crossed out.
  - Tapping a line expands it to show its sources: the scaled raw text (`scaleIngredient`) and the recipe title, or "Added by hand". Each source can be removed.
- **By recipe view:**
  - Groups from `groupByRecipe`, each headed by its title and scale, with a remove-recipe button (with a confirmation).
  - A checkbox on each line. "Added by hand" comes last.
- **Add an item:** a field at the bottom of both views.
- Writes aren't awaited; a failure shows "Couldn't save the change".

## Acceptance criteria

- [x] Component tests: the empty state; both views and the switch; a partly ticked line; ticking a merged line ticks all its sources; expanding to the sources; removing a line; removing a recipe; adding an item by hand; clearing with a confirmation.
- [ ] End to end: two contexts on `#/groceries` after building a list from a seeded Plan day. A tick in one shows in the other; an item added in the second appears in the first.
- [ ] By hand (owner): shop from it on a phone while another device watches, and note any wrong or missed merges in the comments.
- [ ] `npm run check` and `npm run e2e` pass.

## Comments

- 2026-11-06 (agent): Built on `EPIC-6/US-6.5-list-page` (started on top of 04, rebased onto `main` once #49 was merged), test-first through the two seams agreed with the owner (the list page with `src/data` faked, the two-window e2e test).
  - **`GroceryListPage`** replaces 04's stand-in. "Changed 17:30" (or the day) under the title; a **Merged / By recipe** switch kept in `localStorage` (`recipe-app:grocery-view`); in the menu, **New list…** and **Clear list** (asks first).
    - **Merged:** `mergeLines`, A–Z; each row a checkbox (ticked / partly ticked / unticked; ticking ticks all its sources, unticking unticks them) and a button that expands the sources (scaled raw text, recipe title or "Added by hand", each with a remove button). Ticked rows stay in place, crossed out.
    - **By recipe:** `groupByRecipe`, each group headed by title and scale, with a remove-recipe button (asks first); a checkbox per scaled line; "Added by hand" last.
    - **Add an item** under both views (and on an empty list); 1–80 characters.
    - Writes aren't awaited; a failure shows "Couldn't save the change".
  - **Grocery list** is in the menu's sections, after Plan.
  - **E2E** (`e2e/grocery-live-sync.spec.ts`, with `e2e/seed.ts` for REST seeding): seeds a recipe and today's Plan day, Alice builds the list with the builder, Bob opens it; Alice's tick shows on Bob's phone, Bob's added item shows on Alice's.
  - Typecheck, lint and `npm test` pass (826 tests, against the owner's emulator). **The e2e test hasn't run yet:** it needs the emulator ports the owner's `dev:all` holds, so it runs in CI on the PR.
