# 04: Cookbook on wide screens

Status: done
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

- [x] Phone layout unchanged (existing tests pass).
- [x] The iPad Playwright subset checks the cookbook shows more than 2 cards per row.
- [x] `npm run check` and `npm run e2e` pass.

## Comments

**2026-11-08 (agent):** Built.
- **CSS only:** the layout lives in `CookbookPage.module.css` with media queries on `$mantine-breakpoint-sm` / `$mantine-breakpoint-md` (the PostCSS variables), so no JS width checks and no flash on load. The page doesn't need `useWide`.
  - Grid: 2 columns on phones, `repeat(auto-fill, minmax(210px, 1fr))` from `sm`. The loading skeleton uses the same grid. At 1180px that's 5 columns of about 217px.
  - Tags: a plain flex box (Mantine's `Group` sets `flex-wrap` inline, so it couldn't change per breakpoint) that scrolls sideways on phones and wraps from `md`.
  - A–Z list: 3 columns from `md`; rows never split, and a letter stays with its first row (`break-after: avoid`). A letter's rows can continue into the next column, as in a printed index, so the column tops don't always line up.
- Checked with Playwright screenshots at 1180×820 (grid and list), and `e2e/wide.spec.ts` has the US-10.4 check.
