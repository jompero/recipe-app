# 07: Seed the emulator from the base data

Status: done
Story: US-2.7
Branch: `EPIC-2/US-2.7-seed-base-data`
Spec: [../spec.md](../spec.md)
Blocked by: 06

## What to build

- Gitignore `.scratch/base-data/`.
- `npm run seed` still writes the fake members. If `.scratch/base-data/recipes-export.json` exists, it also loads its recipes, images and menu days into the emulator (bypassing the rules, ISO dates converted back to timestamps). If the file is missing, it prints how to create it: import on the Data page, then Export, then save the file there.
- README: the base-data flow, and backing up the file off the laptop together with the Pepperplate originals.

## Acceptance criteria

- [x] With the file present, a wiped emulator plus `npm run seed` shows all recipes with photos in the app.
- [x] Without the file, seed still adds the members and prints the hint, and exits successfully.
- [x] CI doesn't need the file.

## Comments

**2026-11-03 (agent):** Built test-first.
- `scripts/seed/firestoreRest.ts`: plain JSON → Firestore REST values (whole numbers as integers like the web SDK, `TIMESTAMP_FIELDS` as timestamps). `scripts/seed/baseData.ts`: `loadBaseData(file, target, onProgress)` (PATCH per document, 8 at a time, owner token) and `hasRecipes(target)`. The file is read with US-2.6's `parseExportFile`.
- **Owner's decision:** the seed loads the base data **only when the emulator has no recipes**. `dev:all` runs `npm run seed` on every start, and loading every time would undo edits made in the emulator. A wiped emulator still gets everything back automatically.
- Emulator round trip test (`scripts/seed/baseData.emulator.test.ts`, its own project): documents come back identical, dates to the millisecond. An existing document is fully replaced. `hasRecipes` is false, then true.
- **Real file** (32 MB, loaded into a throwaway emulator project, emptied first): 198 recipes and 181 photos in 0.5 s. Against the owner's running emulator, `npm run seed` printed "Recipes are already there, so the base data was skipped" and changed nothing.
- **Emulator quirk found:** a project ID the running emulator has never seen comes back with a copy of `demo-recipe-app`'s data (probably from `--import`). The tests clear their own project first, so they aren't affected, but a test or script that doesn't must empty its project before trusting its contents.
- **Also in this PR:** `.scratch/base-data/` is gitignored (the export was untracked and could have been committed by accident). Vite's dev-server watcher now ignores `.scratch/`, `.emulator-data/` and `docs/pepperplate-data/`, which fixes the owner's "file watcher error: EBUSY" while the 32 MB export was being written. README documents the base-data flow and which folders to back up off the laptop.

**2026-11-03 (owner):** both by-hand checks passed. A wiped emulator plus `dev:all` loaded all 198 recipes with photos, and without the file the seed added the members, printed the hint and exited cleanly.
