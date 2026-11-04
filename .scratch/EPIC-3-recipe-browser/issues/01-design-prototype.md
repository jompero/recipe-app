# 01: Design prototype

Status: done
Story: US-3.1
Branch: `EPIC-3/US-3.1-design-prototype`
Spec: [../spec.md](../spec.md)
Blocked by: none

## What to build

- A **throwaway** prototype of the Nordic cookbook look (spec, "Look"): a 2-column photo grid and one recipe page, using a few real recipes from the emulator (with and without photo, with section headers, with a long ingredient list).
- Starting direction: white page, near-black text, generous spacing; centred, letter-spaced, uppercase italic display serif for titles; book serif for body and numbered steps; tiny tracked uppercase sans-serif labels (time, yield) over a thin rule; one muted accent, the deep linen green; large full-bleed photo.
- Fonts bundled with the app (e.g. Fontsource), never a font CDN. Candidates: Cormorant (titles), EB Garamond (text), Jost (labels). Check the packages' current names and import style against their docs.
- A rough version of the bottom button and the full-screen overlay, so the owner can judge them on the phone too.
- Kept separate from the real app (its own route or entry, clearly marked throwaway) so nothing in it is mistaken for production code.

## Acceptance criteria

- [x] The owner opens the prototype on their phone over Wi-Fi (`npm run dev:all`, LAN; see the README for the firewall) and picks the fonts, sizes, accent and spacing. These choices are recorded in this issue's Comments.
- [x] Any change to the direction (fonts, colours, layout) is also written into the spec's "Look" section.
- [x] The prototype is deleted, or marked to be deleted in US-3.2. No tests are needed for throwaway code.

## Comments

**2026-11-04 (agent):** Built three looks on a dev-only route (`#/prototype`, `?v=A|B|C`) with the real 198 recipes and a rough bottom button + overlay: A "Book" (the spec's direction: Cormorant / EB Garamond / Jost, 2-column grid), B "Magazine" (one column, big photos, Lora body, linen ingredient panel), C "Index" (A–Z contents list with small thumbnails, all EB Garamond). The production build leaves the route out.

**2026-11-04 (owner):** **A for both the grid and the recipe page.** C's index is a nice second way to browse, so it was added to Epic 3 as a list view.

Recorded:
- Spec, "Look": the chosen look, colours (`#1d1d1b` ink, `#4f5d4a` deep linen green) and fonts (Cormorant, EB Garamond, Jost via `@fontsource-variable/*`). Lora is dropped.
- Spec: user story 27, `view=list` in Routes, and a "List view" bullet under "Search, filter, sort". Issue 03 is updated to match.
- The prototype is kept, not merged, on branch `prototype/EPIC-3-US-3.1-design` (commit `157e683`). `VariantBook.tsx` is the style reference for 02 and 03; `VariantIndex.tsx` is the layout reference for the list view.
