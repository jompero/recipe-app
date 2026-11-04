# 04: Recipe page

Status: ready-for-agent
Story: US-3.4
Branch: `EPIC-3/US-3.4-recipe-page`
Spec: [../spec.md](../spec.md)
Blocked by: 03

## What to build

- **Recipe page** at `#/recipe/:id`, one scrolling page: full-bleed photo (the thumbnail first, then `loadFullImage` when it arrives), title, source (a link if `sourceUrl`), yield and times, tags, description, ingredients and numbered steps, with section headers kept in both lists. A missing recipe shows "Recipe not found" with a way back to the grid.
- **Wake Lock:** request the screen lock while the page is visible, request it again on `visibilitychange`, release it on leave. Do nothing if it's unsupported. Check the API against MDN.
- **Ticks:** tap an ingredient or step to tick it. Stored per recipe in `sessionStorage`, kept across a reload, cleared when you leave the recipe.
- **Scaling** (not saved): ½ / 1× / 2× / 3×. A pure function, for lines with a parsed `qty`: multiply `qty` (and `qtyMax`), format as a friendly fraction (¼ ⅓ ½ ⅔ ¾, mixed numbers like 1½) or a sensible decimal for metric amounts, and replace only the amount at the start of `raw` (see `parseIngredientLine` in `src/parsing/ingredientLine.ts`). Lines without `qty` are unchanged.
- **Overlay actions:** *Edit recipe* (route built in 05) and *Archive* / *Unarchive* (built in 06). They can be shown as placeholders until then.

## Acceptance criteria

- [ ] Unit tests for scaling and fraction formatting with real lines from the corpus: whole numbers, fractions, ranges (`qtyMax`), unicode fractions, metric decimals, and lines with no amount.
- [ ] Component tests with `src/data` faked: all sections render, including headers and numbering; the thumbnail is swapped for the full image; ticks toggle and survive a remount; the scale buttons change the amounts; the not-found state.
- [ ] Wake Lock helper tested with a fake `navigator.wakeLock`: requested, re-requested on visible, released on unmount, no error when it's missing.
- [ ] By hand on the phone: the screen stays awake with a recipe open.

## Comments
