# 04: Bookmarklet script

Status: ready-for-agent
Story: US-4.4
Branch: `EPIC-4/US-4.4-bookmarklet-script`
Spec: [../spec.md](../spec.md) (Bookmarklet and import)
Blocked by: none
Wave: 1. Pure logic, no emulator: run `npx vitest run src/bookmarklet/`, `npm run typecheck` and `npm run lint`. CI runs the full check.

## Touches

- New: `src/bookmarklet/` (source, tests, fixture HTML)
- `vite.config.ts` **only if** the build step needs a plugin. Keep the change small and self-contained.
- Read-only: `src/import/recipePayload.ts` (the contract; ask before changing it, because issue 03 builds against it)

No other files. If you need to change an existing file, stop and ask.

## What to build

- **Extraction**, `extractRecipe(doc: Document, url: string): RecipePayload | null`:
  - read every `script[type="application/ld+json"]` (skip blocks that fail to parse);
  - search single objects, arrays and `@graph`; `@type` is a string or an array containing `"Recipe"`;
  - inline `@id` references for `image`, `author` and `publisher` from the same graph;
  - keep only `RECIPE_PAYLOAD_KEYS`.
- **The bookmarklet program:** run on the page, it calls the extraction, then either:
  - encodes the payload (UTF-8 JSON → base64url, no padding) and sets `location.href = APP_URL + "#/import?d=" + encoded`; or
  - finds nothing and shows the alert from the spec (exact wording), without navigating.
  - `APP_URL` is a placeholder filled in later.
- **The build step:** produce, at build time, a minified `javascript:` program with the app URL left as a placeholder, and export `bookmarkletHref(appUrl: string): string` for the install page (issue 07).
  - Options: a Vite `?raw` import of a pre-minified file, a small Vite plugin using esbuild, or a virtual module. Pick the simplest that keeps the bookmarklet tested in source form, and check the current Vite docs.
  - The output must work in `npm run dev` and `npm run build`, and in Vitest.
- The bookmarklet must not depend on anything on the page and must not use `fetch`, popups or `postMessage`.

## Acceptance criteria

- [ ] Unit tests in jsdom on fixture HTML: plain object, array, `@graph` with an `@id` image, `@type` array, a broken JSON block next to a good one, and no recipe (returns `null`).
- [ ] A test that `bookmarkletHref("http://localhost:5173/")` starts with `javascript:`, contains the URL, and stays well under browser bookmark limits (a few KB).
- [ ] A test that the encoder's output decodes back (base64url → UTF-8 JSON) with æøå/äö. Write a tiny decoder in the test; issue 03's codec is built separately.
- [ ] By hand (agent, if possible): run the built program in a desktop browser console on one real recipe page and see it navigate.

## Comments
