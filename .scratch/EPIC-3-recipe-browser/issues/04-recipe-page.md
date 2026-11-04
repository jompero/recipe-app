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

- [x] Unit tests for scaling and fraction formatting with real lines from the corpus: whole numbers, fractions, ranges (`qtyMax`), unicode fractions, metric decimals, and lines with no amount.
- [x] Component tests with `src/data` faked: all sections render, including headers and numbering; the thumbnail is swapped for the full image; ticks toggle and survive a remount; the scale buttons change the amounts; the not-found state.
- [x] Wake Lock helper tested with a fake `navigator.wakeLock`: requested, re-requested on visible, released on unmount, no error when it's missing.
- [x] By hand on the phone: the screen stays awake with a recipe open. **Moved to Epic 7 (7.5 phone smoke test):** Wake Lock needs HTTPS, which the LAN dev server lacks.

## Comments

**2026-11-05 (agent):** Built test-first at the three agreed seams.

- **Scaling** (`src/parsing/scale.ts`, unit tests with real export lines): `scaleIngredient(line, factor)`. `splitAmount` in `ingredientLine.ts` cuts the raw line around its leading amount, so only the amount is rewritten; indentation, bullets, "ca." and glued units (`95g`) stay.
  - Friendly fractions (⅛ ¼ ⅓ ½ ⅔ ¾, mixed like `1½`) within 0.02. Otherwise one decimal (`⅓ cup` ×½ → `0.2 cup`).
  - Metric (g, kg, ml, dl, l) uses decimals with the recipe's own decimal comma (`1,5 dl` ×½ → `0,75 dl`). g and ml of 10 or more round to whole numbers.
  - Ranges scale both ends; a dash becomes `–`, and " to " is kept.
  - Ad-hoc run over the whole export (not committed): 1,754 of 2,188 lines have an amount, and all scale without NaN or no-ops. Known limits, as the spec intends: amounts later in a line ("1 cup **(140g)**") and plurals ("2 head") aren't changed.
- **Wake Lock** (`src/components/useWakeLock.ts`, tests with a fake API): requests `"screen"` on mount and again when the page turns visible; releases on unmount; ignores a missing API or a refused request. Shape checked against TypeScript's DOM types (`navigator.wakeLock.request("screen")` → `WakeLockSentinel.release()`).
- **Page** (`src/components/RecipePage.tsx`, whole-app tests): full-bleed photo (thumbnail first, then `loadFullImage`), title, linked source, Serves / Active / Total over a rule, tags, description, ingredients with the quiet `½ / 1× / 2× / 3×` toggle, and steps numbered across headers. "Recipe not found" links back to the cookbook.
- **Ticks** (`src/components/useTicks.ts`): tap a line to fade and strike it through. Stored in `sessionStorage` per recipe **and per visit** (the history entry's key), because React can't tell leaving from reloading: a reload keeps the ticks, and leaving then reopening starts fresh. Going Back to the same visit restores them.
- **Page actions:** none yet. *Edit recipe* and *Archive* would lead nowhere until 05 and 06, so they're added there.
- **Refactors:** `QuietToggle` moved to its own file (the cookbook toggles and Scale share it); the label style is `LABEL_STYLE` in `theme.ts`; the test fixture is `storedRecipe` in `src/test-utils/recipeFixture.ts`.
- Not done: the page is blank while the live list is still loading, or if it fails, on a deep link. Navigating in from the cookbook is instant, since the list is already loaded.

**2026-11-05 (owner):** tested in Claude's in-app browser, Chrome and Safari. Everything passed except the screen staying awake. Feedback on the photo: a white bar on the right; it should span the full width, with a height that follows the photo up to a cap and never collapses.

**2026-11-05 (agent):**
- **Screen awake:** MDN (Screen Wake Lock API and `WakeLock.request()`, read 2026-11-05) says "Secure context: This feature is available only in secure contexts (HTTPS)". The phone opens the dev server over `http://192.168.86.28`, so the browser doesn't offer the API there and `useWakeLock` correctly does nothing. Agreed with the owner: the phone check moves to Epic 7's go-live smoke test (backlog 7.5), where the app is on HTTPS.
- **Photo:** it was pulled left by the page padding but only as wide as the column, leaving a bar on the right. Now it's the column width plus both paddings, with `height: auto` (the photo's own shape) capped at 70vh and at least 180px.
- **Step numbers:** also visible in the owner's screenshot. The floated number didn't sit beside the full-width tap area, so each step's text dropped below its number. Now they're side by side in a row.
