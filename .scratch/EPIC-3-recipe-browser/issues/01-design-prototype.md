# 01: Design prototype

Status: ready-for-agent
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

- [ ] The owner opens the prototype on their phone over Wi-Fi (`npm run dev:all`, LAN; see the README for the firewall) and picks the fonts, sizes, accent and spacing. These choices are recorded in this issue's Comments.
- [ ] Any change to the direction (fonts, colours, layout) is also written into the spec's "Look" section.
- [ ] The prototype is deleted, or marked to be deleted in US-3.2. No tests are needed for throwaway code.

## Comments
