# 05: Edit and new recipe

Status: done
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

- [x] Unit test: stored lists → text → lists is unchanged for every recipe shape in the tests (headers, no amount, ranges).
- [x] Emulator tests: save after editing passes the rules and recalculates amounts; a new recipe gets the defaults and an auto ID; `createdAt` survives an edit.
- [x] Component tests with `src/data` faked: the form is filled from the recipe; Save is blocked without a title; tags are lowercased and suggested; Cancel or Back with changes asks to discard; a blank form saves a new recipe and opens it.
- [x] By hand: edit a recipe on the phone, and add one with *New recipe*.

## Comments

**2026-11-05 (agent):** Built test-first at the agreed seams. US-3.6 went first, as agreed with the owner.

- **Form logic** (`src/editing/recipeForm.ts`, unit tests): `formFromRecipe`, `draftFromForm` and `formErrors`.
  - The lists are edited as Pepperplate text through `blockText.ts`; saving re-parses, so amounts and units are recalculated.
  - Text fields are trimmed (line breaks inside the description are kept). Tags are lowercased, trimmed, and stripped of blanks and duplicates. A title is required.
  - An untouched form gives back the same recipe, including headers, ranges and lines with no amount. `scripts/pepperplate-corpus.test.ts` checks this for all 198 real recipes (local only; it skips in CI): none changed.
- **Data** (`src/data/recipes.ts`, emulator tests with the real rules):
  - `updateRecipe(id, draft)` sends only the edited fields plus `updatedAt`. The photo, `archived` and `createdAt` stay as stored, which is safer than resending the whole document (agreed with the owner; the rules still validate the whole document after the write). It fails for a missing recipe, and the rules still refuse an empty title.
  - `createRecipe(draft)` uses `addDoc` with an automatic ID, `thumbnail: null`, `hasImage: false`, `archived: false` and server timestamps, and returns the ID.
- **Page** (`src/components/EditPage.tsx`, whole-app tests): `#/recipe/:id/edit` and `#/recipe/new`, opened from *Edit recipe* in the recipe's menu or *New recipe* in the cookbook's.
  - Fields: Title, Description, Source, Source URL, Yield, Active time, Total time, Tags (Mantine `TagsInput`, suggestions from tags in use, lowercased), Ingredients and Method text boxes.
  - The form is keyed by recipe and keeps its own draft while the live list changes (last save wins).
  - A fixed Save / Cancel bar replaces the menu button (the shell hides it on the form routes).
  - Save: an edit goes back to where the form was opened; a new recipe replaces the form with its own page. A failed save shows the error and keeps the form.
- **Discard prompt:** `useBlocker` (data router since 02) blocks leaving to another path while there are unsaved changes, including phone Back (tested with the router's POP). The prompt is "Discard changes?" with *Keep editing* / *Discard*. Saving clears the way.
- Cancel goes back in history; on a deep link (no history) it goes to the recipe or the cookbook.

**2026-11-05 (owner):** by-hand check passed (edit, discard prompt, New recipe, title required). Question: are units parsed yet? Yes, into `qty` / `unit` / `item` behind the scenes; the page always shows the text as typed (ADR-0005). The parsed unit drives scaling now (metric decimals vs fractions) and the grocery list later; no conversion or tidying until Epic 6. Found while checking: "tlk" isn't a known unit spelling (it never appeared in the export), so `2 tlk test` reads as qty 2 with the item "tlk test". Scaling still works. Revisit the spellings list when Epic 6 starts.
