# 08: Microdata fallback in the bookmarklet

Status: ready-for-agent
Story: US-4.4
Branch: `EPIC-4/US-4.4-microdata-fallback`
Spec: [../spec.md](../spec.md) (Bookmarklet and import)
Blocked by: none (04 is merged)
Wave: 2, in parallel with 05 and 07. Pure logic, no emulator: run `npx vitest run src/bookmarklet/`, `npm run typecheck` and `npm run lint`. CI runs the full check.

## Why

Valdemarsro, the owner's main source, has no Recipe in its `ld+json` (only a Yoast Article graph), so the bookmarklet says "No recipe found". The recipe is in the page's HTML as **schema.org microdata**. Checked on https://www.valdemarsro.dk/poelsegryde/ on 2026-11-05:

- `<div … itemscope itemtype="http://schema.org/Recipe">`, with `http` and not `https`, so match both.
- Hidden spans carrying the data: `<span itemprop="cookTime">PT30M</span>`, `<span itemprop="totalTime">PT30M</span>`, `<span itemprop="recipeYield">4</span>`, `<h2 itemprop="name">`.
- `<ul class="ingredientlist">` containing `<li itemprop="recipeIngredient">…</li>` items, with section headers between them as `<li class="ingredient-header">Til servering</li>` (no `itemprop`).
- `<div itemprop="recipeInstructions">` holding one `<p>` per step. The page has 4 such elements.
- `<img src="…/poelsegryde.jpg" itemprop="image">` (1000 px), and `<div itemprop="description">`.
- Comments are nested `itemscope` elements (`schema.org/Comment`) with their own `itemprop="name"` and `itemprop="text"`. Skip them.

## Touches

- `src/bookmarklet/` only (source, tests, a new fixture HTML trimmed by hand from a Valdemarsro page)
- Read-only: `src/import/recipePayload.ts` and the converter. The payload format and the converter must **not** change.

No other files. If you need to change an existing file, stop and ask.

## What to build

When `findRecipe` finds no `ld+json` Recipe, fall back to microdata:

- Take the first element whose `itemtype` ends in `schema.org/Recipe` (http or https).
- Collect its `itemprop` descendants for `RECIPE_PAYLOAD_KEYS`, **skipping anything inside a nested `itemscope`**. The `image`, `author` and `publisher` elements may be scopes themselves: an `ImageObject` with its `url`, or a `Person` or `Organization` with its `name`, which can be passed as small objects or as plain strings.
- **Value of an element:** its `content` attribute, else `datetime`, else `src` (images) or `href` (links), else its text, trimmed.
- **Repeated props** become arrays (`recipeIngredient`, and `recipeInstructions` when there are several elements).
- **Steps:** for a `recipeInstructions` element with `<p>` or `<li>` children, send **one string per child**, so each step stays separate. Otherwise send its text.
- **Ingredient section headers:** a non-ingredient item in the same list as `recipeIngredient` items (e.g. Valdemarsro's `li.ingredient-header`) is sent in order as `"[Til servering]"`. The app's `textToIngredients` already reads `[…]` as a section header.
- `ld+json` still wins when both exist. With neither, show the same "No recipe found" alert.
- Keep the self-contained-function rule from issue 04: the functions that go into the `javascript:` link use no imports, module constants or calls to each other by name.

## Acceptance criteria

- [ ] Unit tests in jsdom on the trimmed Valdemarsro fixture: name, ISO times, yield, all ingredients with `[Til servering]` in the right place, one string per step paragraph, the image URL, and no comment text anywhere.
- [ ] A test that the payload from the fixture goes through `payloadToDraft` and gives the expected draft: times "30 min", the header as a section header, the Valdemarsro hostname as the source. The test only reads the converter; it doesn't change it.
- [ ] A page with both formats uses `ld+json`; a page with neither still alerts.
- [ ] The href test from 04 still passes, and the link stays a few KB.
- [ ] By hand (owner, with 06): the bookmarklet on two Valdemarsro recipes.

## Comments
