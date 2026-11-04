# 05: Paste page and draft into the form

Status: needs-triage
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

- [ ] Component tests: paste → *Make draft* → the form is filled in; Cancel asks to discard; Back returns to the paste page with the text; the overlay lists *Paste recipe*.
- [ ] By hand (owner): paste a recipe copied from a website and from a message, on the phone and on the PC.

## Comments
