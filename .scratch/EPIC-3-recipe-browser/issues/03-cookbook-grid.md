# 03: Cookbook grid

Status: ready-for-agent
Story: US-3.3
Branch: `EPIC-3/US-3.3-cookbook-grid`
Spec: [../spec.md](../spec.md)
Blocked by: 02

## What to build

- **Live list** in `src/data/recipes.ts`: subscribe with `onSnapshot` to all recipes and return `StoredRecipe`s, plus an unsubscribe. Active and archived are split in the browser.
- **Pure logic** (no Firebase), e.g. in `src/cookbook/`:
  - Normalise text: lowercase, accents removed.
  - Match: the query is a substring of the title, any ingredient's `raw`, or any tag. Description and steps aren't searched.
  - Tag filter: a recipe needs **all** selected tags. Tag chips are all tags in use, sorted by count.
  - Sort: `az` (locale-aware title) or `new` (newest `createdAt` first).
  - URL ↔ state: `q`, `tags` (comma-separated), `sort`, `view=list`, `archived=1`.
- **Grid page** at `#/`: 2-column photo cards with titles, a placeholder card image when `thumbnail` is null, search box, tag chips, sort, loading placeholders, and "No recipes match" with a clear-filters action. A card opens `#/recipe/:id` (built in 04). Style: variant A of the prototype (`VariantBook.tsx` on branch `prototype/EPIC-3-US-3.1-design`).
- **List view** (user story 27): a grid/list toggle. The list is an A–Z index like a book's contents page: title, a small line with total time and the first tags, and a small square thumbnail (or placeholder) per row. Letter dividers only with A–Z sort. Same filters, same typography. Reference: `VariantIndex.tsx` on the prototype branch, for layout only (the type follows A).
- **Overlay actions** on the grid: *New recipe* (the route lands in 05) and *Show archived*. The `archived=1` view itself is built in 06.
- **Scroll restore:** Back from a recipe returns to the same scroll position. React Router's `<ScrollRestoration>` may need a data router (`createHashRouter`) rather than `<HashRouter>`, so check the current docs and choose: switch routers, or restore by hand.

## Acceptance criteria

- [x] Unit tests: normalisation ("Spinach" / "spin", accents), matching on title / ingredient / tag, the all-tags filter, both sorts, tag counts, and the URL ↔ state round trip.
- [x] Emulator test: the live list delivers the recipes, then an update after a write.
- [x] Unit test: letter grouping for the list (dividers with A–Z, none with newest-first).
- [x] Component tests with `src/data` faked: cards and placeholders render, search, tag chips and sort update the URL and the grid, the empty state clears filters, and live updates re-render.
- [x] Component test: the toggle switches to the list and back, keeps the filters, and sets `view=list`.
- [ ] By hand on the phone: browse the 198 recipes, open one, press Back, and land at the same scroll position with the filters kept.

## Comments

**2026-11-04 (agent):** Built test-first at the three agreed seams, with scroll restore left for the by-hand check.

- **Cookbook logic** (`src/cookbook/cookbook.ts`, unit tests): `selectRecipes(recipes, state)` handles the archived split, search, the all-tags filter and sorting; also `tagChips`, `readCookbookState` / `cookbookSearch` (URL ↔ state) and `letterGroups`. Notes:
  - Search folds accents with Unicode NFD on both sides; section headers in the ingredients aren't searched.
  - A–Z uses `Intl.Collator` (base sensitivity, numeric), so "2-minute" comes before "10-minute". Newest-first ties (all imports share a date) fall back to A–Z.
  - Tag chips count only the current view (active or archived); ties go A–Z.
  - The URL leaves out defaults and writes `tags=a,b` with plain commas.
  - Titles that don't start with a letter group under `#`.
- **Live list** (`watchRecipes` in `src/data/recipes.ts`, emulator test): `onSnapshot` on all recipes. It reads server timestamps as `estimate`, so a recipe this device just saved doesn't show as 1970. The test matches deliveries by exact IDs: the client cache can briefly deliver documents from earlier tests.
- **Page** (`src/components/CookbookPage.tsx`, whole-app tests with the live list faked): title with a recipe count, search, tag chips, A–Z / Newest, Grid / List, loading placeholders, an error alert, and "No recipes match" with *Clear filters* (clears search and tags; keeps sort and view). Filter changes **replace** the URL (no history entries), so Back leaves the cookbook.
- **One subscription per session:** `LiveRecipesProvider` (in `App`, around the shell) shares the live list through `useLiveRecipes()`. Back from a recipe finds the grid already loaded, which scroll restore needs, and 04 reads its recipe from the same list.
- **Scroll restore:** React Router's `<ScrollRestoration />` in `App` (data router since 02). `vitest.setup.ts` stubs `window.scrollTo` for jsdom.
- **Placeholder recipe page** at `#/recipe/:id` (title only) so a card doesn't land on the router's error screen, which would unmount the shell and break restore. 04 replaces it.
- `HomePage.tsx` is gone; its page actions moved to `CookbookPage`.
- Gotcha: a test that renders the app with a fake `src/data/recipes.ts` lacking `watchRecipes` doesn't fail cleanly. The run stalls until the worker is killed, so `App.test.tsx`'s fake now includes it.
