# 04: Recipe data module and rules validation

Status: ready-for-agent
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

- [ ] Rules tests extend the Epic 1 matrix: a valid recipe and image pass; an unknown field, each wrong type, an empty title, and an oversized thumbnail or image each fail.
- [ ] Emulator tests for the data module: batch write and read back, existing-ID check.

## Comments
