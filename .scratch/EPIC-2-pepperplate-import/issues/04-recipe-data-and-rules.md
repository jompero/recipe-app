# 04: Recipe data module and rules validation

Status: done
Story: US-2.4
Branch: `EPIC-2/US-2.4-recipe-data-rules`
Spec: [../spec.md](../spec.md)
Blocked by: 01, 03

## What to build

- `src/data/recipes.ts` with what Epic 2 needs: write a batch of recipes with given IDs (thumbnail on the recipe, full image through `images.ts`), list which of a set of IDs already exist, and read all recipes (for export). Epic 3 adds the live list, editing and archiving.
- Batched writes with progress. Check Firestore's current batch and request-size limits in the docs, and split batches by count and size (~25 MB of full images in total).
- `firestore.rules` shape validation, as in the spec:
  - `recipes`: only the schema's field names; `title` a non-empty string; `ingredients` / `instructions` / `tags` lists; `archived` / `hasImage` booleans; `thumbnail` a string under ~60 KB, or null; `createdAt` / `updatedAt` timestamps.
  - `recipe_images`: only `data`, a string under ~900 KB.
- Update the blueprint's schema section to the spec's final schema.

## Acceptance criteria

- [x] Rules tests extend the Epic 1 matrix: a valid recipe and image pass; an unknown field, each wrong type, an empty title, and an oversized thumbnail or image each fail.
- [x] Emulator tests for the data module: batch write and read back, existing-ID check.

## Comments

**2026-11-03 (agent):** `src/data/recipes.ts` provides `saveRecipes(list, onProgress)`, `existingRecipeIds(ids)`, `loadAllRecipes()` and the types `RecipeToSave` / `StoredRecipe`. `images.ts` gains `addFullImageToBatch`, so a recipe and its photo are written in the same batch and the collection name stays in `images.ts` (ADR-0001).

- **Limits** (Firestore docs, checked 2026-11-03): the quotas and transactions pages no longer give a fixed number of writes per batch. A batch is one request, capped at 10 MiB. `in` takes up to 30 values. Batches are split at ~8M characters or 100 writes. Emulator test: 12 images at the cap (~10.8 MB) save, with progress after each batch. Removing the size budget makes that test fail (checked by hand, then reverted).
- **Rules lookup limit:** the docs cap `exists()` / `get()` calls at 20 per batched write. In the emulator, a 60-recipe batch passes, so the repeated `isMember()` lookup of the same `allowed_users` document doesn't count 60 times. Real Firebase isn't tested until Epic 7, but the 100-write cap and the per-batch size keep each batch small anyway.
- **Rules:** every schema field is required (a type check fails on a missing field) and no others are allowed. Thumbnail at most 60,000 characters or null, image at most 900,000. Member deletes of `recipes` and `recipe_images` are denied (owner's decision; the console still can). `menu_days` is unchanged until Epic 5. 30+ new rules tests, including partial updates (checked against the whole resulting document) and `serverTimestamp()`.
- **Re-import:** a recipe saved again keeps no old `createdAt` (both dates are reset). If a re-imported recipe lost its photo, the old `recipe_images` document stays but `hasImage` is false. Nothing deletes images (the rules forbid it).
- Blueprint schema section is now final for `recipes` / `recipe_images`. `project-setup.md` notes that the repo's `firestore.rules` is the source of truth.
