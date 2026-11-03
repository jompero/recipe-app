# EPIC-2: Pepperplate Import

Status: needs-triage

Replaces the Epic 2 placeholder in `docs/backlog.md`. Settled in a grilling session on 2026-11-03, held before Epic 3's grilling because Epic 3 depends on the recipe shape and real data this epic produces.

## Problem Statement

The 198 Pepperplate recipes and 181 rescued photos exist only as text files and JPEGs on the laptop. Every later epic (browser, input, calendar, grocery list) needs them in Firestore, in the final recipe shape, before it can be built against real data. There's also no way to back up or move data, and that's needed both as protection (Spark has no backups) and as the route to the live project at go-live.

## Solution

- Parse the Pepperplate `.txt` format and its ingredient lines into the final recipe shape, with parsers that Quick Paste (Epic 4) reuses.
- Compress the photos in the browser into a thumbnail and a full image.
- Add a **Data page** to the app with three sections: **Import Pepperplate** (pick both folders, preview, import all 198 at once), **Export everything** (one JSON file) and **Restore from file**.
- The export becomes the **base data**: kept in a gitignored file, loaded by `npm run seed` so a wiped emulator starts with all recipes, and restored on the live site at go-live (Epic 7).
- Add shape validation for `recipes` and `recipe_images` to the rules.

This is a one-off bulk import. Adding recipes day to day (Quick Paste, the bookmarklet, the photo upload and a blank form) is Epic 4.

## Build order

1. **US-2.1** Recipe text parser
2. **US-2.2** Ingredient line parser
3. **US-2.3** Image compressor and images data module
4. **US-2.4** Recipe data module and rules validation
5. **US-2.5** Data page: Pepperplate import
6. **US-2.6** Export and restore
7. **US-2.7** Seed the emulator from the base data

## User Stories

1. As the owner, I want all 198 Pepperplate recipes imported in one go, so that I never add them one by one.
2. As the owner, I want each recipe's title, description, source, URL, yield, times, ingredients (with section headers) and instructions (with section headers) kept, so that nothing from Pepperplate is lost.
3. As the owner, I want Pepperplate Categories imported as tags, so that Epic 3 can filter by them.
4. As the owner, I want Pepperplate Notes kept, so that tips and substitutions aren't lost.
5. As the owner, I want every ingredient line's original text kept, with the amount, unit and item pulled out where possible, so that grocery merging (Epic 6) has structured data and nothing is lost when parsing fails (ADR-0005).
6. As the owner, I want the 181 photos matched to their recipes automatically and compressed to a thumbnail and a full image, so that the cookbook has pictures and stays within the free tier.
7. As the owner, I want a read-only preview with a summary and a list of recipes with warnings before anything is written, so that I can spot parsing problems first.
8. As the owner, I want re-running the import to replace the same recipes (after a warning) rather than duplicate them, so that a failed or improved import is safe to retry.
9. As a member, I want an "Export everything" button that downloads one JSON file of recipes, images and menu days, so that there's a backup.
10. As the owner, I want to restore from an export file, so that data can be recovered and moved to the live project at go-live.
11. As a developer, I want `npm run seed` to load the base data into the emulator when the file is there, so that a wiped emulator is one command from the full cookbook.
12. As a developer, I want the rules to reject recipe and image documents with the wrong shape, so that an app bug can't write junk.

## Implementation Decisions

### Recipe schema (final for Epic 2; replaces the illustrative one in the blueprint)

```jsonc
// recipes/{id}
{
  "title": "Blueberry Oatmeal Muffins",       // non-empty
  "description": "…",                         // Pepperplate Description, then a blank line, then Notes
  "source": "", "sourceUrl": "",
  "yield": "", "activeTime": "", "totalTime": "",   // free text, exactly as written
  "tags": ["chicken", "salad"],               // lowercased, trimmed
  "ingredients": [
    { "raw": "1 1/2 cups milk", "qty": 1.5, "unit": "cup", "item": "milk" },
    { "raw": "1-2 cloves garlic, finely chopped", "qty": 1, "qtyMax": 2, "unit": "clove", "item": "garlic, finely chopped" },
    { "raw": "Salt & pepper", "item": "Salt & pepper" },
    { "header": "For the sauce" }
  ],
  "instructions": [ { "text": "…" }, { "header": "While pasta is boiling" } ],
  "thumbnail": "data:image/jpeg;base64,…",    // or null
  "hasImage": true,                           // full image in recipe_images/{same id}
  "archived": false,
  "createdAt": "<timestamp>", "updatedAt": "<timestamp>"
}
// recipe_images/{recipeId}
{ "data": "data:image/jpeg;base64,…" }
```

- **Notes go into the description** (no separate field): description, a blank line, then the Notes text with its line breaks kept. Notes runs from `Notes:` to the end of the file (13 recipes; one includes nutrition and substitution lines).
- **Yield and times stay as text.** They're messy ("4 peeps", "Serves 2", "25 minutes") and half are empty. Parse them later only if a feature needs it.
- **No `createdBy` / `updatedBy`.** Emulator user IDs don't exist on the live project, and nothing displays them. Only the dates are kept.
- **Source stays as written** ("Valdemarsro" and "VALDEMARSRO" aren't merged).
- Writes from the app use `serverTimestamp()`. Restore writes the dates from the file.

### Parsers (`src/parsing/`, pure functions, shared with Epic 4)

- **Recipe text parser:** reads the `Key: value` header lines, then `Ingredients:` and `Instructions:` blocks. Each tab-indented line is one ingredient or one step. `[Text]` lines become `{ header }`. Blank lines are ignored. `Categories:` is split on commas into tags. `Image:` is ignored, because photos are matched by file name. A header line that doesn't start with a known key continues the field above it (real descriptions run over several lines, one containing "Durability in freezer: …"). Notes start a final block that runs to the end of the file.
- **Ingredient line parser:** pulls out the leading amount (whole numbers, decimals, `3/4`, `1 1/2`, unicode fractions such as `½`, ranges `1-2` → `qty` + `qtyMax`). It standardises known units to one spelling (`tablespoons` / `Tbsp.` / `tbsp` → `tbsp`; `teaspoon` / `tsp.` → `tsp`; `cups` → `cup`; `g.` → `g`; plus `kg`, `dl`, `ml`, `l`, and counts like `clove`, `slice`, `can`, `handful`). Everything else goes into `item`, prep notes included (`garlic, finely chopped`). A line with no amount gets only `item`. `raw` is always exactly the source line.

### Images

- `src/utils/imageCompressor.ts` (moved here from backlog 4.3): `browser-image-compression` to JPEG. Full image ~1024px / ~100–150 KB; thumbnail ~320px / ~10–15 KB. A size check keeps each image under the rules caps.
- `src/data/images.ts` saves and loads thumbnails and full images. It's the only image seam (ADR-0001).
- Photos match recipes by file name: `<recipe .txt stem>.jpg` (all 181 match; the other 17 recipes get `thumbnail: null`, `hasImage: false`).

### Import (Data page, `#/data`, linked from the app menu)

- Every member can see the Data page. The rules can't tell an owner from other members, and the group is small and trusted.
- You pick the recipe folder and the images folder. Files are parsed and images compressed in the browser.
- **Preview** (read-only): totals (recipes, with photos, ingredient lines with no amount) and a list of recipes with warnings (no photo, no ingredients, no instructions, unparsed lines). Tapping one shows what was parsed. There's no editing here; fixes happen in Epic 3's edit page.
- **IDs** come from the file name (e.g. `15MinPulledOatsMushroomPasta` → `15-min-pulled-oats-mushroom-pasta`), so running the import again overwrites instead of duplicating. If any of those IDs already exist, the confirm step says "X recipes already exist and will be replaced; your edits to them will be lost". Recipes created later in the app use auto IDs and are never touched.
- Writes run in batches with progress shown. Check Firestore's current batch and request-size limits against the docs when building: the full images total ~25 MB.

### Export and restore (`src/data/backup.ts`)

- Export downloads one JSON file: `{ format: "recipe-app-export", version: 1, exportedAt, recipes, recipeImages, menuDays }`, keyed by document ID, with timestamps as ISO strings.
- Restore checks `format` and `version`, shows the counts, asks for confirmation, then overwrites every document in the file (same IDs) and **never deletes** anything that isn't in the file. Dates are restored from the file.

### Base data and seed

- The base-data export is kept at gitignored `.scratch/base-data/recipes-export.json`. The repo is public, so it is never committed. Back it up off the laptop together with the Pepperplate originals.
- `npm run seed` still writes the fake members, and also loads the base data when the file exists (converting ISO dates back to timestamps). If it's missing, the script prints how to create it. CI never needs it.

### Rules

- `recipes`: only the schema's field names are allowed. `title` is a non-empty string. `ingredients`, `instructions` and `tags` are lists. `archived` and `hasImage` are booleans. `thumbnail` is a string under ~40 KB, or null. `createdAt` and `updatedAt` are timestamps.
- `recipe_images`: only `data`, a string under ~900 KB.
- The rules don't validate the shape of each list item (too awkward in the rules language). The parsers and types guard that.

## Testing Decisions

- The parsers are pure and get thorough unit tests. Cases come from real Pepperplate lines: fractions, unicode fractions, ranges, unit spellings, no-amount lines, headers, Notes at the end of the file, multi-line descriptions.
- A test parses all 198 files from `docs/pepperplate-data/` when they're present and checks that none throws and every recipe has a title. It's skipped in CI, where the files are gitignored.
- Rules tests extend the Epic 1 matrix: valid documents pass; each forbidden field, wrong type, empty title and oversized image fails.
- Data modules are tested against the emulator: import writes, export → restore round-trip gives the same documents, and restore never deletes.
- The Data page gets component tests with the data modules faked at the `src/data` seam. The real 198-recipe import is checked by hand in the emulator.

## Out of Scope

- Editing in the preview, and all recipe editing (Epic 3).
- Quick Paste, the bookmarklet, the camera/upload UI and a blank "New recipe" form (Epic 4). Epic 4.3 keeps only the camera/upload UI, since the compressor is built here.
- Parsing yield or times into numbers; splitting prep notes out of `item`; scaling servings.
- Cleaning up tags or source names during import.
- Hiding or removing the Pepperplate section after go-live (decide in Epic 7).

## Further Notes

- Epic 3 (`.scratch/EPIC-3-recipe-browser/spec.md`) builds on this schema. Its edit form converts the stored lists back to Pepperplate-syntax text and parses them again on save, so the parsers must round-trip cleanly.
- When Epic 2 is done, update `docs/backlog.md` (Epic 2 → spec link; drop the compressor from 4.3), update the blueprint's schema section, and update the "Status" section of `CLAUDE.md`.
