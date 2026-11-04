# 03: `ld+json` converter

Status: done
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

- [x] Unit tests for every fixture, checking the resulting draft fields.
- [x] Duration tests: `PT1H30M`, `PT45M`, `P0DT0H20M`, `PT90M` → "1 hr 30 min"; empty or invalid → "".
- [x] Codec round trip with æøå and äö; a bad string and the wrong `v` throw.
- [x] Missing fields give empty strings and lists, never a crash.

## Comments

**2026-11-04 (agent):** Built test-first in `src/import/`: `jsonLd.ts` (`payloadToDraft`), `duration.ts` (`formatDuration`, plus `durationMinutes` / `formatMinutes` for prep + cook) and `payloadCodec.ts` (`encodePayload`, `decodePayload`, `InvalidPayloadError`), each with a test file. `recipePayload.ts` and `src/parsing/` are unchanged.

- **Fixtures** (`src/import/fixtures/`), taken from the live pages' `ld+json` on 2026-11-04 and trimmed by hand to a few ingredients and steps. Values are copied as written, and `@id` references are inlined the way the bookmarklet will do it:
  - RecipeTin Eats: WordPress/WPRM `@graph`, `HowToSection`s, no publisher, `&quot;`;
  - Madens Verden (Danish): WPRM `@graph`, yield `["4", "4 personer"]`, æøå;
  - Food Network UK: the steps as one HTML string (`<p>…</p>`, `&deg;`), yield as the number `6`, no `totalTime` (so prep + cook);
  - NYT Cooking: an array of `ImageObject`s with `contentUrl`, publisher "NYT Cooking", only `totalTime`;
  - BBC Good Food: `ImageObject` with `url`, author array, publisher object;
  - Pinch of Yum: `&#8217;` and other entities in `HowToStep` text, yield `["12", "12 cookies"]`.
- **Valdemarsro has no Recipe in its `ld+json`.** Two recipe pages (`/lasagne/`, `/boller-i-karry/`) had only a Yoast Article graph, so Madens Verden is the Danish fixture. The bookmarklet will show "No recipe found" on Valdemarsro unless its recipe data is somewhere else. Worth checking by hand in issue 04's site test.
- **`@type` as an array:** the sites I know that use it (Allrecipes, Serious Eats and other Dotdash sites) refused scripted fetches. `@type` isn't in `RecipePayload` either, since the bookmarklet drops it, so it's covered by issue 04's extraction tests, not here. The converter does read `@type` arrays on instruction items (`HowToSection`).
- **Choices the spec left open:**
  - "Most descriptive" yield = the longest string.
  - Source hostname drops a leading `www.` (`recipetineats.com`).
  - `<br>` and closing `p`/`div`/`li`/`h1–6`/`tr` tags count as line breaks. Script and style contents are dropped. Inside one `HowToStep` or array entry, line breaks are joined, so one step stays one step.
  - A `HowToStep` with no `text` falls back to its `name`, then to its own `itemListElement` (`HowToDirection`/`HowToTip`).
  - Image URLs are resolved against the page (so Betty Crocker's `//mojo…` works), and only http(s) URLs are used. `url` is tried before `contentUrl`.
  - Durations: days, hours, minutes and seconds (rounded to minutes); zero gives "". A `totalTime` that is missing, unreadable or zero falls back to prep + cook.
  - `decodePayload` also accepts standard base64 and padding. It checks `v === 1`, that `url` is a string and that `recipe` is an object.
- **For 06:** "the first usable image" is sometimes a thumbnail (Pinch of Yum lists a 225px one first, while WordPress/WPRM sites list the full image first). I followed the spec. If photos come out small, a later change could prefer the largest image.
- Ran `npx vitest run src/import/` (91 tests), `npm run typecheck` and `npm run lint`, all passing. The full check (emulator) is left to CI.
