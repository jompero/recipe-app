# 03: `ld+json` converter

Status: ready-for-agent
Story: US-4.3
Branch: `EPIC-4/US-4.3-jsonld-converter`
Spec: [../spec.md](../spec.md) (Bookmarklet and import: Converter)
Blocked by: none
Wave: 1. Pure logic, no emulator: run `npx vitest run src/import/`, `npm run typecheck` and `npm run lint`. CI runs the full check.

## Touches

- New: `src/import/jsonLd.ts`, `src/import/jsonLd.test.ts`, fixtures under `src/import/fixtures/`
- New, if you split them out: `src/import/duration.ts` (+ test), `src/import/payloadCodec.ts` (+ test)
- Read-only: `src/import/recipePayload.ts` (the contract, already on `main`; ask before changing it, because issue 04 builds against it), `src/parsing/`

No other files. If you need to change an existing file, stop and ask.

## What to build

- `payloadToDraft(payload: RecipePayload): { draft: RecipeDraft; photoUrl: string | null }`, following the spec's *Converter* rules:
  - decode entities and strip tags in all text;
  - instructions as a string (split on line breaks), an array of strings, `HowToStep`, or `HowToSection` (nested), with sections becoming `[Header]` lines;
  - ingredients from `recipeIngredient`, falling back to `ingredients`;
  - the most descriptive yield;
  - ISO 8601 durations → "1 hr 30 min" / "45 min" (prep → active; total, or prep plus cook → total);
  - source from the publisher's name, else the hostname of `payload.url`; `sourceUrl` = `payload.url`;
  - no tags;
  - the first usable image URL (string, array, `ImageObject` with `url`/`contentUrl`).
  - Ingredient and instruction lines go through `textToIngredients` / `textToInstructions`, so amounts are parsed.
- The **codec** the app uses: `encodePayload(payload): string` and `decodePayload(d: string): RecipePayload` (UTF-8 JSON ↔ base64url, no padding). `decodePayload` throws a clear error on bad input or `v !== 1`.
  - The bookmarklet (04) has its own tiny encoder because it must be standalone. Keep the format plain (standard base64url, no padding) so the two agree.
- Use `DOMParser` for entity decoding if convenient; jsdom is available in tests.

## Fixtures

Make 5–6 fixtures from real recipe pages, **hand-trimmed** to the Recipe object (cut reviews, nutrition and long text; keep the shapes). Cover:

- `@graph` (WordPress/WPRM or Yoast);
- `HowToSection`;
- plain-string instructions with HTML;
- array yields;
- `ImageObject`;
- `@type` as an array;
- a Danish site (e.g. Valdemarsro, if it has `ld+json`).

Store them as trimmed `RecipePayload` JSON.

## Acceptance criteria

- [ ] Unit tests for every fixture, checking the resulting draft fields.
- [ ] Duration tests: `PT1H30M`, `PT45M`, `P0DT0H20M`, `PT90M` → "1 hr 30 min"; empty or invalid → "".
- [ ] Codec round trip with æøå and äö; a bad string and the wrong `v` throw.
- [ ] Missing fields give empty strings and lists, never a crash.

## Comments
