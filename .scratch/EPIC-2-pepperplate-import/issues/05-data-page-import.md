# 05: Data page, Pepperplate import

Status: done
Story: US-2.5
Branch: `EPIC-2/US-2.5-data-page-import`
Spec: [../spec.md](../spec.md)
Blocked by: 02, 04

## What to build

- A Data page at `#/data` that every member can open. Until Epic 3's overlay exists, a plain link from the member home is enough.
- **Import Pepperplate:** pick the recipe folder and the images folder (a directory picker or multi-select; check which works in desktop Chrome and on phones, desktop being enough). Parse every `.txt`, match photos by `<stem>.jpg`, compress them.
- **Preview** (read-only): totals (recipes, with photos, ingredient lines with no amount) and the list of recipes with warnings (no photo, no ingredients, no instructions, unparsed lines). Tapping one shows what was parsed.
- **IDs** from the file name in kebab-case (`15MinPulledOatsMushroomPasta` → `15-min-pulled-oats-mushroom-pasta`). If some already exist, the confirm step says "X recipes already exist and will be replaced; your edits to them will be lost".
- Import writes with progress, then shows a done summary. Dates are `serverTimestamp()`. `archived: false`.

## Acceptance criteria

- [x] Component tests with `src/data` faked: preview totals and warnings, the overwrite warning, progress and done states.
- [x] Unit test for file name → ID.
- [x] By hand in the emulator: import all 198, check 181 have a thumbnail and a full image, then run it again and confirm there are no duplicates.

## Comments

**2026-11-03 (agent):** Built test-first. `src/import/pepperplateImport.ts` (pure: `recipeIdFromFileName`, `buildImportPreview`), `src/import/runImport.ts` (compress each photo, then `saveRecipes` with progress), and `src/components/DataPage.tsx` at `#/data`, linked from the placeholder home until Epic 3.

- **Folder pickers:** `<input type="file" webkitdirectory multiple>`, one for recipes and one for photos. Photos are optional; non-`.txt` and non-`.jpg` files are ignored (e.g. `manifest.json`).
- **IDs:** kebab-case at lower→Upper, digit↔letter and ACRONYMWord boundaries. All-caps names stay one word (`EASYVEGGIEQUESADILLAS` → `easyveggiequesadillas`). The real-data test checks that all 198 IDs are unique and all 181 photos match.
- **Change from the issue:** "lines with no amount" isn't a per-recipe warning. About 20% of lines have none ("Salt & pepper"), so it would flag most recipes and bury the real problems. The preview shows the total instead, and each recipe's parsed view marks those lines "no amount". Warnings are No photo / No ingredients / No instructions.
- **Progress:** two phases, "Compressing photos: n of 181", then "Saving recipes: n of 198". A photo that fails to compress is skipped (recipe saved without it) and listed in the done summary. A failed save shows "Import failed: …" and the Import button stays.
- **2026-11-03 (owner):** by-hand run done exactly as described: 198 imported, 181 with photos, and a second run replaced them (198 still) instead of duplicating.
