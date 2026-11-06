# The grocery list is one shared document of source lines

The grocery list is stored as a single document, `grocery_lists/current`, holding `{ lines: [{ id, raw, scale, recipeId?, title?, entryId? }], ticked: [lineId], updatedAt }`. It is a snapshot taken when the list is built from the Plan, not worked out live from it, so later Plan changes don't move lines or ticks while someone is in the shop. It stores the original ingredient lines (source lines), not merged ones: merging and unit conversion run in the browser each time the list is shown, from `raw` (ADR-0005). That means a parser or synonym fix improves the list at once, and a line added by hand merges with the recipe lines without rewriting the document. Ticks are line ids in their own array, so ticking, adding and removing are all `arrayUnion`/`arrayRemove` writes: two members working on the list at once don't overwrite each other, and no write needs a transaction, so the list works offline. There is only one current list, with no history; building again either replaces it or adds to it.

## Consequences

- The rules allow only the document ID `current`, check the keys, and cap both lists at 600 items. Each line's shape is checked by `src/data/groceries.ts`, as with recipe ingredients.
- The grocery list is left out of export and restore: it is short-lived, and a restore shouldn't bring back an old list.
- A recipe's title is copied onto its lines when the list is built, so a renamed or archived recipe still reads correctly on the list.
