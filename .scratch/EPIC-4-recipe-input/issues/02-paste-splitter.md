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

- [x] Unit tests with realistic samples: an English recipe copied from a website, a Danish one (Valdemarsro-style), a Finnish one, a recipe with sub-sections, one with no headings, and one with Windows line endings.
- [x] Nothing is dropped: every non-empty input line (except headings and recognised label lines) ends up in some field. Add a test that checks this.
- [x] Empty input gives an empty draft (no crash).

## Comments

**2026-11-04 (agent):** Built `pasteToDraft` in `src/parsing/pasteText.ts`, with 14 tests in `pasteText.test.ts` (English website copy, Valdemarsro-style Danish with sub-sections, Finnish, an English recipe with sub-sections in both lists, no headings, Windows line endings, nothing dropped, empty input). The heading words, label words, number-first yield nouns ("4 personer") and the sub-heading length limit (40 characters) are all at the top of the file. Choices beyond the spec:
- A label line's value must contain a digit ("Serves 4", but not "Makes a great lunch"), so ordinary description lines aren't read as labels.
- Several labels on one line split by `|`, `·` or `•` ("Prep: 10 min | Serves 4") are all read, but only if every part is a recognised label. Otherwise the whole line goes to the description.
- If a label's field is already filled, the line goes to the description instead of overwriting it. Unrecognised labels such as "Cook time: 40 min" go there too.
- "Headings found" means an ingredients or method heading. With only a notes heading, the no-headings fallback still applies, and the notes still go to the description.
- In the fallback, label lines still fill yield and times. A line with a step number ("1. Mix") is a step even though it starts with a digit.
- `▢` (the checkbox copied from recipe sites) and `·` are stripped as bullets too. A line that is only a step number ("1.") is kept as it is, so nothing is lost.
- Known limit, as the spec says: with no headings, an ingredient without an amount ("pinch of salt") goes to the instructions.
