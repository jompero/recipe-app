# 01: Recipe text parser

Status: ready-for-agent
Story: US-2.1
Branch: `EPIC-2/US-2.1-recipe-text-parser`
Spec: [../spec.md](../spec.md)
Blocked by: none

## What to build

- A pure function in `src/parsing/` that turns one Pepperplate `.txt` file's text into a recipe draft (the spec's schema, minus IDs, images and timestamps) plus a list of warnings.
- Header lines are `Key: value`: Title, Description, Source, Original URL → `sourceUrl`, Yield, Active → `activeTime`, Total → `totalTime`, Categories → `tags` (split on commas, trimmed, lowercased), Image (ignored). An unknown key produces a warning, not a failure.
- `Ingredients:` and `Instructions:` blocks: each tab-indented line is one ingredient (`{ raw }`, with parsing added in US-2.2) or one step (`{ text }`). `[Text]` lines become `{ header: "Text" }`. Blank lines are ignored.
- `Notes:` runs to the end of the file, line breaks kept, and is added to the end of the description after a blank line (or becomes the description if that's empty).
- The reverse direction too: list → Pepperplate-syntax text for the ingredient and instruction blocks (Epic 3's edit form). Text → list → text must not change anything.
- Shared TypeScript types for the recipe shape (`Recipe`, `IngredientLine`, `InstructionLine`).

## Acceptance criteria

- [ ] Unit tests built from real lines: headers, section headers in both blocks, empty fields, multi-line Notes (the Blueberry Oatmeal Muffins case), Categories, an unknown key.
- [ ] Round-trip tests for both blocks.
- [ ] A test parses all 198 files in `docs/pepperplate-data/` when they're present (skipped in CI): none throws, and every recipe has a title and at least one ingredient or step, or a warning saying so.
- [ ] Nothing under `docs/pepperplate-data/` is modified.

## Comments
