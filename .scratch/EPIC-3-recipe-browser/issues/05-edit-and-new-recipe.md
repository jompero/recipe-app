# 05: Edit and new recipe

Status: ready-for-agent
Story: US-3.5
Branch: `EPIC-3/US-3.5-edit-and-new-recipe`
Spec: [../spec.md](../spec.md)
Blocked by: 04

## What to build

- **Edit page** at `#/recipe/:id/edit`, and the same form blank at `#/recipe/new`. A Save / Cancel bar replaces the bottom button.
- **Fields:** title (required), description, source, source URL, yield, active time, total time, tags (chips with autocomplete from tags in use, saved lowercase), an ingredients text box and an instructions text box.
- **Text boxes** use the Pepperplate syntax through `src/parsing/blockText.ts` (`ingredientsToText` / `textToIngredients`, `instructionsToText` / `textToInstructions`). Saving reparses, so amounts and units are recalculated.
- **Data** in `src/data/recipes.ts`:
  - *Save after editing:* write the whole valid document (the rules require every field), keeping `createdAt`, `thumbnail`, `hasImage` and `archived`, with `updatedAt: serverTimestamp()`.
  - *New recipe:* an auto ID, `createdAt` and `updatedAt` as server timestamps, `archived: false`, `thumbnail: null`, `hasImage: false`. Returns the new ID so the app can open the recipe page.
- **Last save wins:** the form keeps its own draft while live data changes underneath. No conflict warning.
- **Discard prompt:** leaving with unsaved changes asks "Discard changes?", including via phone Back. Check React Router 8's blocking API (`useBlocker`, which may need a data router; see 03).
- Photos can't be changed here (Epic 4).

## Acceptance criteria

- [ ] Unit test: stored lists → text → lists is unchanged for every recipe shape in the tests (headers, no amount, ranges).
- [ ] Emulator tests: save after editing passes the rules and recalculates amounts; a new recipe gets the defaults and an auto ID; `createdAt` survives an edit.
- [ ] Component tests with `src/data` faked: the form is filled from the recipe; Save is blocked without a title; tags are lowercased and suggested; Cancel or Back with changes asks to discard; a blank form saves a new recipe and opens it.
- [ ] By hand: edit a recipe on the phone, and add one with *New recipe*.

## Comments
