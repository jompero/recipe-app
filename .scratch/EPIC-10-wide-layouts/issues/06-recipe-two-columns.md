# 06: Recipe page in two columns

Status: done
Story: US-10.6
Branch: `EPIC-10/US-10.6-recipe-columns`
Spec: [../spec.md](../spec.md) (Recipe page)
Blocked by: 02

## What to build

**Prototype pick (01):** **N, the Nordic spread.**
- The photo is on the left at 38.2% width, sticky, with the screen's height below the top bar, `fit="cover"`.
- On the right: the title (32px), source, description (max about 620px) and meta, centred.
- Below that, ingredients (42%, sticky, scrolling on their own) beside the method.
- A recipe without a photo uses A's arrangement: the centred header above the two columns.

The variant picked in 01 (**A**: full-width photo on top; or **N**: the Nordic Cookbook spread with a cropped photo on the left at about 38%) on wide screens. Ingredients are sticky (below the top bar) while the method scrolls. The Scale toggle stays beside the Ingredients heading.

- The page's `maw={640}` widens on wide screens to whatever the variant needs.
- Phones keep the single column.
- The full image still replaces the thumbnail once loaded, and offline the thumbnail stays.
- A recipe with no photo still looks deliberate in the chosen variant (check N especially).
- Very long ingredient lists: the sticky column scrolls on its own if it is taller than the screen.

## Acceptance criteria

- [x] Component test: ingredients and method are side by side when wide, stacked when not.
- [x] The iPad Playwright subset opens a recipe and checks the two columns.
- [ ] Screenshots of a long recipe, a short one and one without a photo, attached to Comments.
- [x] `npm run check` and `npm run e2e` pass.

## Comments

**2026-11-08 (agent):** Built.
- **Layouts:** `Recipe` builds the header, ingredients and method once and arranges them three ways, marked with `data-layout`:
  - `column` on phones: unchanged.
  - `spread` on wide screens with a photo: N, with the photo at 38.2% and sticky, and the ingredients at 42% and sticky.
  - `columns` on wide screens without a photo: the header centred (max 760px) above a 360px ingredients column and the method, max 1060px.
- **Sticky columns** sit at `var(--top-bar) + md` and scroll on their own (`max-height: 100dvh − top bar − 2·md`), so a long ingredient list still reaches its end.
- **Tests:**
  - Component tests: four new (spread, columns, ticking and scaling when wide, phone keeps one column).
  - The iPad e2e check (`e2e/wide.spec.ts`, US-10.6) seeds a 30-step recipe with a photo, checks that photo, ingredients and method sit side by side, and that the photo and ingredients are still in view after scrolling to step 30.
- **Not run locally:** the owner's `dev:all` emulators held the ports, so `npm run e2e` and the rules tests ran only in CI; typecheck, lint and 202 component tests passed locally. For the same reason no screenshots yet; the box below stays open for the owner's look on the iPad after deploy.
