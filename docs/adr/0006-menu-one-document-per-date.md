# Menus are one document per date

The menu is stored as `menu_days/{YYYY-MM-DD}` holding `{ entries: [{ recipeId, slot? }] }`, not the blueprint's `weekly_menus` document with `Monday`…`Sunday` fields. Browsing any date range, viewing history, rolling dice across a range and building grocery lists all become simple range queries on the document ID, and a day can hold several meals. Entries are added with `arrayUnion`, so two people adding to the same day don't overwrite each other. Recipes are archived (`archived: true`) instead of deleted, so past menus never point at a missing recipe.

## Amendment (2026-11-05, Epic 5)

The entry shape changed when Epic 5 was specified (`.scratch/EPIC-5-plan/spec.md`). There is no `slot`: a day is an ordered list of entries without labels. An entry can be a short text note as well as a recipe, and every entry has a random `id`: `{ id, recipeId } | { id, note }`, plus `updatedAt` on the document. The `id` keeps entries distinct, so the same recipe can be on a day twice and `arrayRemove` takes away exactly one. Removing the last entry leaves `entries: []` rather than deleting the document, because a safe delete would need a transaction, and transactions fail offline. In the interface the menu is called the **Plan** (see `GLOSSARY.md`).

## Amendment (2026-11-06, Epic 6)

A recipe entry may carry a `scale` of `0.5`, `2` or `3` (`.scratch/EPIC-6-grocery-list/spec.md`). The grocery list multiplies that recipe's amounts by it. A 1× entry has no `scale` field, so existing documents need no change. Because entries are objects in an array, changing the scale removes the old entry and adds the new one (same `id`) in one batch, which moves the entry to the end of its day. That is accepted: rewriting the whole array instead would let the last writer win over another member's change.
