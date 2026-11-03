# 01: Recipe text parser

Status: done
Story: US-2.1
Branch: `EPIC-2/US-2.1-recipe-text-parser`
Spec: [../spec.md](../spec.md)
Blocked by: none

## What to build

- A pure function in `src/parsing/` that turns one Pepperplate `.txt` file's text into a recipe draft (the spec's schema, minus IDs, images and timestamps) plus a list of warnings.
- Header lines are `Key: value`: Title, Description, Source, Original URL → `sourceUrl`, Yield, Active → `activeTime`, Total → `totalTime`, Categories → `tags` (split on commas, trimmed, lowercased), Image (ignored). A line that doesn't start with a known key continues the field above it (see Comments).
- `Ingredients:` and `Instructions:` blocks: each tab-indented line is one ingredient (`{ raw }`, with parsing added in US-2.2) or one step (`{ text }`). `[Text]` lines become `{ header: "Text" }`. Blank lines are ignored.
- `Notes:` runs to the end of the file, line breaks kept, and is added to the end of the description after a blank line (or becomes the description if that's empty).
- The reverse direction too: list → Pepperplate-syntax text for the ingredient and instruction blocks (Epic 3's edit form). Text → list → text must not change anything.
- Shared TypeScript types for the recipe shape (`Recipe`, `IngredientLine`, `InstructionLine`).

## Acceptance criteria

- [x] Unit tests built from real lines: headers, section headers in both blocks, empty fields, multi-line Notes (the Blueberry Oatmeal Muffins case), Categories, a multi-line description.
- [x] Round-trip tests for both blocks.
- [x] A test parses all 198 files in `docs/pepperplate-data/` when they're present (skipped in CI): none throws, and every recipe has a title and at least one ingredient or step, or a warning saying so.
- [x] Nothing under `docs/pepperplate-data/` is modified.

## Comments

**2026-11-03 (agent):** Built test-first at three seams: `parseRecipeText` (`src/parsing/recipeText.ts`), the edit-form text pairs `textToIngredients` / `ingredientsToText` and `textToInstructions` / `instructionsToText` (`src/parsing/blockText.ts`), and a run over the real export. Types are in `src/parsing/types.ts`.

Changes from the plan, all found in the real files:
- The files use CRLF line endings, but `FinnishPotatoSalad` also has bare LFs inside its description.
- Descriptions can span several lines, and `Berrybutter`'s description contains `Durability in freezer: 3 months…`. So there are no unknown-key warnings: a line that doesn't start with a known key continues the field above it. Spec and issue 05 updated.
- Warnings are `No title`, `No ingredients`, `No instructions`. The real export gets exactly 5, all `No instructions`: Bagels, BreadDay, CrispyRiceBalls and FishSticks have an empty block, and FinnishPotatoSalad's steps are inside its description. All 198 have a title and ingredients, and 50 have tags.
- Notes are checked before the block keywords, so an `Ingredients:` line inside Notes stays note text.
- The real-data test is `scripts/pepperplate-corpus.test.ts` (the `scripts` Vitest project), because the app's tsconfig has no Node types. It skips when `docs/pepperplate-data/` is missing, as in CI. Parser imports use `.ts` extensions (the repo's style), which also lets the Node-side tsconfig check them.
- The edit-form text writes a blank line before each section header and ignores blank lines when read back. Text → list → text tidies loosely typed text once, then stays unchanged.
- `textToIngredients` returns `{ raw }` only. US-2.2 adds the amount parsing to it and to `parseRecipeText`.
