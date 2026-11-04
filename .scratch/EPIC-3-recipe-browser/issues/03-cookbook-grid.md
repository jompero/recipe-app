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
  - URL ↔ state: `q`, `tags` (comma-separated), `sort`, `archived=1`.
- **Grid page** at `#/`: 2-column photo cards with titles, a placeholder card image when `thumbnail` is null, search box, tag chips, sort, loading placeholders, and "No recipes match" with a clear-filters action. A card opens `#/recipe/:id` (built in 04).
- **Overlay actions** on the grid: *New recipe* (the route lands in 05) and *Show archived*. The `archived=1` view itself is built in 06.
- **Scroll restore:** Back from a recipe returns to the same scroll position. React Router's `<ScrollRestoration>` may need a data router (`createHashRouter`) rather than `<HashRouter>`, so check the current docs and choose: switch routers, or restore by hand.

## Acceptance criteria

- [ ] Unit tests: normalisation ("Spinach" / "spin", accents), matching on title / ingredient / tag, the all-tags filter, both sorts, tag counts, and the URL ↔ state round trip.
- [ ] Emulator test: the live list delivers the recipes, then an update after a write.
- [ ] Component tests with `src/data` faked: cards and placeholders render, search, tag chips and sort update the URL and the grid, the empty state clears filters, and live updates re-render.
- [ ] By hand on the phone: browse the 198 recipes, open one, press Back, and land at the same scroll position with the filters kept.

## Comments
