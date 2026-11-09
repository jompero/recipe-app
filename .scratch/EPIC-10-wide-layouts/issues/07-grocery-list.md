# 07: Grocery list column and amounts

Status: done
Story: US-10.7
Branch: `EPIC-10/US-10.7-grocery-layout`
Spec: [../spec.md](../spec.md) (Grocery list)
Blocked by: 02

## What to build

**Prototype pick (01):** "potatoes · 2 kg" (the amount dimmed and `sm`, inline after the name) and a 560px column.

- **Wide:** the list page (`GroceryListPage.tsx`) is a centred column of about 560px, including the view switch and "Add an item". Also cap the builder at `#/groceries/new` the same way.
- **Amount placement, all sizes:** replace the `justify="space-between"` row in `MergedRow` with the variant picked in 01: "potatoes · 2 kg" or "2 kg potatoes".
  - Long names wrap cleanly.
  - The expanded sources and ticked styling still work.
  - The by-recipe view already shows raw lines and stays as it is.

## Acceptance criteria

- [x] Component tests updated for the new row text order.
- [x] The iPad Playwright subset checks the list is in its column.
- [x] `npm run check` and `npm run e2e` pass.

## Comments

**2026-11-08 (agent):** Built.
- **Column:** `maw={{ md: GROCERY_COLUMN }}` (560px, in `groceryColumn.ts`) with `mx="auto"` on both the list and the builder (`#/groceries/new`). It's a Mantine responsive style prop, so the cap is CSS and phones are untouched.
- **Merged row:** one `Text`: the name, then the amount in a dimmed `sm` span (" · 2 dl") that doesn't wrap. The strike-through on a ticked line covers both.
- **Tests:** the merged-view test now reads "milk · 5 dl". The iPad e2e check (US-10.7) adds an item by hand and checks "cream … · 2 dl" in a centred row no wider than 560px.
