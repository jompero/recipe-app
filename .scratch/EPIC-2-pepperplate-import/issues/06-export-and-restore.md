# 06: Export and restore

Status: ready-for-agent
Story: US-2.6
Branch: `EPIC-2/US-2.6-export-restore`
Spec: [../spec.md](../spec.md)
Blocked by: 05

## What to build

- `src/data/backup.ts` and two more sections on the Data page.
- **Export everything:** downloads one JSON file `{ format: "recipe-app-export", version: 1, exportedAt, recipes, recipeImages, menuDays }`, keyed by document ID, with timestamps as ISO strings. File name includes the date.
- **Restore from file:** checks `format` and `version`, shows the counts, asks for confirmation, then overwrites every document in the file (same IDs, dates from the file) with progress. It **never deletes** anything that isn't in the file.

## Acceptance criteria

- [ ] Emulator test: export, then restore into an empty database gives the same documents (dates included).
- [ ] Emulator test: restore leaves a document that isn't in the file untouched.
- [ ] Restored documents pass the 04 rules.
- [ ] A file with the wrong `format` or `version` is rejected with a clear message.

## Comments
