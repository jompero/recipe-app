# 01: Photo in the edit form

Status: ready-for-agent
Story: US-4.1
Branch: `EPIC-4/US-4.1-photo`
Spec: [../spec.md](../spec.md) (Photo)
Blocked by: none
Wave: 1. **This is the only wave-1 issue that runs the emulator** (`npm run test:ci`).

## Touches

- `src/components/EditPage.tsx` (+ its tests), and a new photo component next to it if you like
- `src/editing/recipeForm.ts` (+ tests), if the photo becomes part of the form state
- `src/data/recipes.ts`, `src/data/images.ts` (+ emulator tests)
- `firestore.rules`, `tests/rules/firestore.rules.test.ts`
- `docs/adr/0001-images-in-firestore-not-storage.md` (a Consequences note)
- Read-only: `src/utils/imageCompressor.ts`

If you need to change anything else, stop and ask.

## What to build

- **The photo area** in the edit form, for new and existing recipes. It shows the current photo (or a placeholder) and has Change / Remove. It accepts:
  - the file picker (`<input type="file" accept="image/*">`, **no** `capture` attribute);
  - **pasting** an image from the clipboard (Ctrl+V while the edit page is open, outside the text boxes, or on the photo area);
  - **dropping** an image file onto the area.
- Compress as soon as a photo is chosen (`compressImage`), and show a preview. On `ImageTooLargeError` (or a non-image), show an error and keep the previous photo.
- **Saving:** the photo is written only on Save, in **one batch** with the recipe:
  - *Existing recipe:* text fields plus photo changes. Set: thumbnail, `hasImage: true`, `recipe_images/{id}`. Remove: `thumbnail: null`, `hasImage: false`, delete `recipe_images/{id}`. Unchanged: as today.
  - *New recipe:* the ID comes from `doc(collection(db, "recipes"))`, then a batch writes the recipe and, if there is one, its image. Return the ID as `createRecipe` does today.
  - Cancel discards the photo. A changed or removed photo counts as unsaved (the discard prompt).
- **Keep "stage a photo from a `File` or `Blob`" callable from outside the component** (e.g. an exported hook or function, or a prop), because issue 06 feeds it an image fetched from a URL.
- **Rules:** allow `delete` on `recipe_images/{id}` for members. Recipes stay undeletable. Update the comment above `isValidRecipe` ("archived, never deleted") to match.
- **ADR-0001:** add a Consequences bullet: since Epic 4, removing a photo deletes its `recipe_images` document; recipes are still never deleted.

## Acceptance criteria

- [ ] Rules tests: a member can delete a `recipe_images` doc and a non-member can't; deleting a recipe is still denied for members.
- [ ] Emulator tests: new recipe with a photo (both docs, `hasImage: true`, thumbnail set); existing recipe gets a photo; photo replaced; photo removed (image doc gone, `thumbnail: null`, `hasImage: false`); text-only save leaves the photo alone.
- [ ] Component tests (`src/data` faked, compressor faked): pick, paste and drop each stage a preview; Remove clears it; the too-large error keeps the old photo; Save sends the photo change; Cancel with a photo change asks to discard.
- [ ] `npm run check` passes (run it only when no other worktree or `dev:all` is using the emulator ports 8080/9099).
- [ ] By hand (owner): add a photo with the phone camera; on a PC, "Copy image" on a website and Ctrl+V it in.

## Comments
