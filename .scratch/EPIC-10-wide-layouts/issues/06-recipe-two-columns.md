# 06: Recipe page in two columns

Status: ready-for-agent
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

- [ ] Component test: ingredients and method are side by side when wide, stacked when not.
- [ ] The iPad Playwright subset opens a recipe and checks the two columns.
- [ ] Screenshots of a long recipe, a short one and one without a photo, attached to Comments.
- [ ] `npm run check` and `npm run e2e` pass.

## Comments
