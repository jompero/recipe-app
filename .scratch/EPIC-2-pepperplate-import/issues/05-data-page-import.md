# 05: Data page, Pepperplate import

Status: ready-for-agent
Story: US-2.5
Branch: `EPIC-2/US-2.5-data-page-import`
Spec: [../spec.md](../spec.md)
Blocked by: 02, 04

## What to build

- A Data page at `#/data` that every member can open. Until Epic 3's overlay exists, a plain link from the member home is enough.
- **Import Pepperplate:** pick the recipe folder and the images folder (a directory picker or multi-select; check which works in desktop Chrome and on phones, desktop being enough). Parse every `.txt`, match photos by `<stem>.jpg`, compress them.
- **Preview** (read-only): totals (recipes, with photos, ingredient lines with no amount) and the list of recipes with warnings (no photo, no ingredients, no instructions, unknown header keys, unparsed lines). Tapping one shows what was parsed.
- **IDs** from the file name in kebab-case (`15MinPulledOatsMushroomPasta` → `15-min-pulled-oats-mushroom-pasta`). If some already exist, the confirm step says "X recipes already exist and will be replaced; your edits to them will be lost".
- Import writes with progress, then shows a done summary. Dates are `serverTimestamp()`. `archived: false`.

## Acceptance criteria

- [ ] Component tests with `src/data` faked: preview totals and warnings, the overwrite warning, progress and done states.
- [ ] Unit test for file name → ID.
- [ ] By hand in the emulator: import all 198, check 181 have a thumbnail and a full image, then run it again and confirm there are no duplicates.

## Comments
