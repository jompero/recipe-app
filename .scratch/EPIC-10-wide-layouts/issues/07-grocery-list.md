# 07: Grocery list column and amounts

Status: ready-for-agent
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

- [ ] Component tests updated for the new row text order.
- [ ] The iPad Playwright subset checks the list is in its column.
- [ ] `npm run check` and `npm run e2e` pass.

## Comments
