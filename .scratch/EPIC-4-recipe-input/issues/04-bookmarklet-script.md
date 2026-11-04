# 04: Bookmarklet script

Status: done
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

- [x] Unit tests in jsdom on fixture HTML: plain object, array, `@graph` with an `@id` image, `@type` array, a broken JSON block next to a good one, and no recipe (returns `null`).
- [x] A test that `bookmarkletHref("http://localhost:5173/")` starts with `javascript:`, contains the URL, and stays well under browser bookmark limits (a few KB).
- [x] A test that the encoder's output decodes back (base64url → UTF-8 JSON) with æøå/äö. Write a tiny decoder in the test; issue 03's codec is built separately.
- [ ] By hand (agent, if possible): run the built program in a desktop browser console on one real recipe page and see it navigate.

## Comments

**2026-11-04 (agent):** Built in `src/bookmarklet/bookmarklet.ts`, with tests and fixture HTML next to it. `vite.config.ts` and `src/import/recipePayload.ts` are unchanged.

- **Build step: no Vite plugin.** `findRecipe`, `encodePayload` and `runBookmarklet` are self-contained functions. `bookmarkletHref(appUrl)` puts their source text (`Function.prototype.toString`) together with the payload keys and the app URL into one `javascript:` program, so the code that runs on a site is the code the tests run. `vite build` minifies it with the rest of the bundle: Oxc is the default client minifier (checked against vite.dev/config/build-options, and the Vite 8.3.5 types). `vite dev` and Vitest run it unminified, which still works. **Keep those three functions self-contained** (no imports, module constants or calls to each other by name), or the link breaks. The tests catch that because they run the href itself.
- `%`, newlines and tabs are percent-encoded in the href. Browsers percent-decode a `javascript:` URL and drop raw newlines, which would let a `//` comment swallow the rest of the code.
- `@id` references are inlined one level deep (for example the publisher's own `logo` reference stays a reference). Fields written next to the `@id` win over the graph node.
- Extra tests: the href evaluated as a browser would (navigates with a payload that decodes back; on a page with no recipe it alerts with the exact text and doesn't navigate), and an app URL containing `%`.
- **Hand check, partly done:** not run in a desktop browser. I built the module on its own with Vite and Oxc (about 2 KB minified; the app build will be smaller because library mode keeps whitespace), then ran it in jsdom on real saved pages. Allrecipes: navigates, about 5.6 KB hash. BBC Good Food: navigates, about 2.7 KB hash. **Valdemarsro (kanelsnegle): "No recipe found"**: its Yoast `@graph` has no Recipe node, and the recipe is in **microdata** (`itemtype="https://schema.org/Recipe"`), which the spec doesn't cover. Owner decision needed: add a microdata fallback (a follow-up issue), or accept Paste recipe for such sites. The desktop-browser check stays open for the owner (with 06/07).
