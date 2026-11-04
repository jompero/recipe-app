# 05: Paste page and draft into the form

Status: done
Story: US-4.2
Branch: `EPIC-4/US-4.2-paste-page`
Spec: [../spec.md](../spec.md) (The shared path, Quick Paste)
Blocked by: 01, 02

## Touches

- New: the paste page component (+ tests)
- `src/routes.tsx` (a route, e.g. `#/paste`)
- `src/components/CookbookPage.tsx` (the *Paste recipe* overlay action next to *New recipe*)
- `src/components/EditPage.tsx`, `src/editing/recipeForm.ts` (the draft input)

If you need to change anything else, stop and ask.

## What to build

- **The seam** that issue 06 reuses: `#/recipe/new` accepts router state `{ draft: RecipeDraft; photoUrl?: string }`. Export a type for it.
  - The form starts filled from `draft`, but its "unsaved" baseline stays the empty form, so Cancel or Back asks to discard.
  - `photoUrl` is accepted but unused until 06.
- **Paste page:** one large text box and a *Make draft* button (disabled when empty). It runs `pasteToDraft` (02) and navigates to `#/recipe/new` with the draft.
  - Back from the form returns here with the text still in the box (keep it in `sessionStorage` or history state). Clear it after a successful save.
- **Overlay:** *Paste recipe* in the cookbook's page actions, next to *New recipe*.

## Acceptance criteria

- [x] Component tests: paste → *Make draft* → the form is filled in; Cancel asks to discard; Back returns to the paste page with the text; the overlay lists *Paste recipe*.
- [ ] By hand (owner): paste a recipe copied from a website and from a message, on the phone and on the PC.

## Comments

- 2026-11-04 (agent): Built on `EPIC-4/US-4.2-paste-page`. **The seam for 06:** `NewRecipeState` in `src/editing/recipeForm.ts` (`{ draft, photoUrl?, clearOnSave? }`) and a `newRecipeState(state)` guard. `EditPage` reads it on `#/recipe/new` and fills the form from `draft`, with the empty form as the "unsaved" baseline (`EditForm` gained a `baseline` prop), so Cancel or Back asks to discard even if the form is untouched. `photoUrl` is accepted but unused. **Choice beyond the issue:** `clearOnSave` is a sessionStorage key that the form removes after a successful save. That way the paste page owns its own storage key (`quickPaste.text`) and the form doesn't have to know about Quick Paste. 06 can use it for its kept `d` if useful. **Paste page:** `src/components/PastePage.tsx` at `#/paste`. It has a *Recipe text* box (saved to sessionStorage as you type) and *Make draft* (disabled when the box is empty or only spaces). *Make draft* runs `pasteToDraft` and navigates to `/recipe/new` with the state. *Paste recipe* sits in the cookbook overlay right after *New recipe*. The tests are in `PastePage.test.tsx` (overlay, disabled button, filled form, Cancel asks, Back keeps the text, Save creates the recipe and clears the text, plain New recipe still leaves without asking) and in `recipeForm.test.ts` (the guard). The emulator wasn't run; `npx vitest run` on components/editing/parsing (185 tests), `npm run typecheck` and `npm run lint` pass, and CI runs the full check. The by-hand check is left for the owner.

**2026-11-05 (owner):** By-hand check: pasting works and the text gets parsed, so the basics get through. The filled-in form didn't always fill as the owner intuitively expected (checked against intuition, not against the coded rules). More thorough Quick Paste testing with real samples is wanted later; see the Epic 4 wrap-up.
