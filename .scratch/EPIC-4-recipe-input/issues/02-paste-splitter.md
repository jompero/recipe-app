# 02: Paste splitter

Status: ready-for-agent
Story: US-4.2
Branch: `EPIC-4/US-4.2-paste-splitter`
Spec: [../spec.md](../spec.md) (Quick Paste)
Blocked by: none
Wave: 1. Pure logic, no emulator: run `npx vitest run src/parsing/pasteText.test.ts`, `npm run typecheck` and `npm run lint`. CI runs the full check.

## Touches

- New: `src/parsing/pasteText.ts`, `src/parsing/pasteText.test.ts`
- Read-only: everything else in `src/parsing/` (reuse `splitAmount`, `textToIngredients`, `textToInstructions`)

No other files. If you need to change an existing file, stop and ask.

## What to build

`pasteToDraft(text: string): RecipeDraft`, which splits a whole recipe pasted as text into a draft, following the rules in the spec's *Quick Paste* section:

- the title is the first line that isn't empty;
- section headings in English, Danish and Finnish (ingredients, method, notes), ignoring case and a trailing `:`, with headings dropped;
- bullets and step numbers stripped;
- yield and time label lines fill `yield`, `activeTime` and `totalTime`;
- any other lines before the first heading go to the description, and notes are added to it too;
- short lines ending in `:` inside a section become `[Header]` lines;
- with no headings: lines starting with an amount go to ingredients, and the rest go to instructions;
- ingredient and instruction lines go through `textToIngredients` / `textToInstructions`;
- `tags`, `source` and `sourceUrl` stay empty.

Keep the heading and label word lists in one easy-to-extend place.

## Acceptance criteria

- [ ] Unit tests with realistic samples: an English recipe copied from a website, a Danish one (Valdemarsro-style), a Finnish one, a recipe with sub-sections, one with no headings, and one with Windows line endings.
- [ ] Nothing is dropped: every non-empty input line (except headings and recognised label lines) ends up in some field. Add a test that checks this.
- [ ] Empty input gives an empty draft (no crash).

## Comments
