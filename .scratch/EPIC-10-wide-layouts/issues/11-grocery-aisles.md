# 11: Grocery aisle sections

Status: ready-for-agent
Story: US-10.11
Branch: `EPIC-10/US-10.11-aisles`
Spec: [../spec.md](../spec.md) (Grocery list)
Blocked by: 07

## What to build

- **Aisle table** in `src/groceries/`, next to the synonym table: merge key (or keyword) → aisle. Seed it from the ingredients in the base data, so most real items are placed.
- **Fixed order:** Produce, Bakery, Dairy, Meat & fish, Dry goods, Frozen, Other. Unknown items go to Other.
- **Merged view, all sizes:** items grouped under aisle headings in that order, A–Z within an aisle. Empty aisles are hidden. Items added by hand are placed the same way.
- The by-recipe view is unchanged. No schema or rules change.
- GLOSSARY: add **Aisle**.

## Acceptance criteria

- [ ] Unit tests: the lookup (plurals and synonyms reach the same aisle), unknowns go to Other, the order of aisles.
- [ ] A note in Comments on how many distinct merge keys in the base data land in Other.
- [ ] Component test: the merged view shows aisle headings in order.
- [ ] `npm run check` and `npm run e2e` pass.

## Comments
