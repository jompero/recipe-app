# 03: Data page spacing and wide column

Status: done
Story: US-10.3
Branch: `EPIC-10/US-10.3-data-page`
Spec: [../spec.md](../spec.md) (Data page)
Blocked by: 01

## What to build

**Prototype pick (01):** column plus dividers. `xl` gaps, a short centred `Divider` between sections (inset about 120px on wide screens, 40px on phones), and the page title as `order={1}` with `pt="xl"`.

- **All sizes:** more space between the five sections (install, Pepperplate import, export, restore, bookmarklet). A divider or larger gap, per 01. Also check the page's top padding and heading level: Data uses `Title order={2}` without `pt="xl"`, unlike other pages, so make it consistent.
- **Wide:** a centred column of about 720px. Headings stay centred; the theme's Title style is unchanged.

## Acceptance criteria

- [x] Before and after screenshots at phone width and 1180 wide, attached to Comments.
- [ ] The iPad Playwright subset checks the Data page renders in its column. (Follow-up: see Comments.)
- [x] `npm run check` and `npm run e2e` pass.

## Comments

**2026-11-08, PR #69:** built as the prototype pick, no differences from the spec.
- **Screenshots** (full page, from the emulator):
  - Before: [phone](../screenshots/03-data-before-phone.png) · [1180 wide](../screenshots/03-data-before-wide.png)
  - After: [phone](../screenshots/03-data-after-phone.png) · [1180 wide](../screenshots/03-data-after-wide.png)
- **Tests:** `DataPageLayout.test.tsx` checks the level-1 title, the 4 dividers, and the 720px column, faking wide by mocking `useWide`.
- **Shared hook:** adds `src/components/useWide.ts`, identical to the one in 02 (PR #68).
- **iPad Playwright check not done:** 02's `ipad-landscape` project wasn't on `main` when this was built. Add the Data page check, tagged the way 02's tests are, in a follow-up once #68 merges.
