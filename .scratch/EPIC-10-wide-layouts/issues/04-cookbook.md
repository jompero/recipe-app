# 04: Cookbook on wide screens

Status: ready-for-agent
Story: US-10.4
Branch: `EPIC-10/US-10.4-cookbook`
Spec: [../spec.md](../spec.md) (Cookbook)
Blocked by: 02

## What to build

**Prototype pick (01):** card size M, `repeat(auto-fill, minmax(210px, 1fr))` from 48em up. 320px thumbnails stay (05 is `wontfix`).

- The grid (`CookbookPage.tsx`, `SimpleGrid cols={2}`, and its loading skeleton) gets responsive columns: 2 on phones, 3–4 on iPad portrait, 5–6 on wide screens (cards about 200–240px, per 01). Cards keep the 4/5 aspect.
- Tag chips wrap onto lines on wide screens instead of the side-scrolling `nowrap` row. Phones keep scrolling.
- The A–Z list flows into 2–3 columns on wide screens, keeping its letter headings with their rows.
- Search, sort and the URL state are unchanged.

## Acceptance criteria

- [ ] Phone layout unchanged (existing tests pass).
- [ ] The iPad Playwright subset checks the cookbook shows more than 2 cards per row.
- [ ] `npm run check` and `npm run e2e` pass.

## Comments
