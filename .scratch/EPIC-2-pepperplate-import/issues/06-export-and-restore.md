# 06: Export and restore

Status: done
Story: US-2.6
Branch: `EPIC-2/US-2.6-export-restore`
Spec: [../spec.md](../spec.md)
Blocked by: 05

## What to build

- `src/data/backup.ts` and two more sections on the Data page.
- **Export everything:** downloads one JSON file `{ format: "recipe-app-export", version: 1, exportedAt, recipes, recipeImages, menuDays }`, keyed by document ID, with timestamps as ISO strings. File name includes the date.
- **Restore from file:** checks `format` and `version`, shows the counts, asks for confirmation, then overwrites every document in the file (same IDs, dates from the file) with progress. It **never deletes** anything that isn't in the file.

## Acceptance criteria

- [x] Emulator test: export, then restore into an empty database gives the same documents (dates included).
- [x] Emulator test: restore leaves a document that isn't in the file untouched.
- [x] Restored documents pass the 04 rules.
- [x] A file with the wrong `format` or `version` is rejected with a clear message.

## Comments

**2026-11-03 (agent):** Built test-first.
- `src/backup/exportFile.ts` (pure, so US-2.7's Node seed script can reuse it): the `ExportFile` type, `parseExportFile` with user-facing messages (not JSON / not an export / wrong version / damaged section, document or date), and `TIMESTAMP_FIELDS`. Only `recipes.createdAt` / `updatedAt` are timestamps today; a later epic adding timestamp fields adds them there.
- `src/data/backup.ts`: `exportEverything()` and `restoreEverything(file, onProgress)`. Images go through `images.ts` (new `loadAllFullImages`, plus `addFullImageToBatch`), per ADR-0001.
- The size-limited batching moved from `recipes.ts` into a shared `src/data/batches.ts` (`commitInBatches`), used by both. The US-2.4 recipe emulator tests still pass on it.
- Data page: "Export everything" downloads `recipe-app-export-<exportedAt date>.json`. "Restore from file" shows what the file holds, confirms, then shows progress and "Restored N documents.", or the refusal/failure message.
- Emulator tests: export → empty → restore → export gives identical content (dates to the millisecond). Restore replaces the file's documents and leaves others alone. Progress reaches the document count. All writes run as a member with the real rules, so restored recipes pass them.
- Component tests fake `src/data/backup.ts`, and the import and App tests fake it too, so nothing loads the real Firebase setup without `.env`. Checked with a blank `VITE_FIREBASE_API_KEY`, as in CI.
