# 02: Wide shell: breakpoint, top bar, content cap, iPad e2e

Status: done
Story: US-10.2
Branch: `EPIC-10/US-10.2-wide-shell`
Spec: [../spec.md](../spec.md) (Sizes and widths, Navigation, Testing)
Blocked by: 01

## What to build

**Prototype pick (01):** the top bar. A `--top-bar` CSS variable on the AppShell (56px or 0) lets sticky elements sit below it; it worked well in the prototype.

- **"Wide" in one place:** a shared hook or constant for Mantine's `md` (62em). The theme keeps Mantine's default breakpoints.
- **Top bar** in `MemberShell` on wide screens (or the top-right button, if that won in 01):
  - sticky at the top
  - section links (Cookbook · Plan · Grocery list · Data · Account) in the Book look, current page underlined
  - the page's actions from `usePageMenu` as buttons on the right
  - hidden on the edit form, as the menu button is today (`isEditForm`)
- On wide screens, hide the bottom menu button and drop `AppShell.Main`'s `pb={100}` padding. Phones unchanged.
- **Content cap** of about 1200px, centred, for every member page. Pages that already set `maw` keep it for now.
- **Fixed elements:** the update banner stays above the bar. The offline strip stays at the bottom. The roller's sticky action bar sticks below the top bar on wide screens (check `RollPage.tsx` sticky `top`).
- **Tests:**
  - a way to fake "wide" in Vitest (`matchMedia` is mocked to `matches:false` in `vitest.setup.ts`)
  - a second Playwright project, about `ipad-landscape`, 1180×820 Chromium, running only tests tagged for it; add a test that navigates to each section through the top bar
  - check whether CI's `e2e` job needs any change
- GLOSSARY: add **Top bar** and **Wide layout**.

## Acceptance criteria

- [x] At 1180×820 the top bar shows, navigates to every section and shows the page's actions. At phone width the bottom button and overlay are unchanged.
- [x] Component tests cover top bar vs button by width.
- [x] The iPad Playwright project runs in CI with the navigation test.
- [x] `npm run check` and `npm run e2e` pass.

## Comments

**2026-11-08 (agent):** Built.
- **"Wide":** `src/components/useWide.ts` (`WIDE_QUERY`, `useWide()`). 03 adds the identical file, so the two merge cleanly.
- **Top bar:** `TopBar.tsx` (in `AppShell.Header`, 56px) holds the section links and the page's actions, the actions read from `usePageMenu` as before. The sections and `sectionOf()` (the roller counts as Plan, recipes as Cookbook) moved to `sections.ts`, shared with the menu overlay.
- **On wide screens:** `MemberShell` caps content at `CONTENT_MAX_WIDTH` (1200px) and sets `--top-bar` (56px, or 0px on phones and the edit form). The bottom button is hidden. The roller's sticky bar uses `top: var(--top-bar, 0px)`.
- **Update banner:** it's fixed at the top above everything, so it covers the bar while it shows. No change needed.
- **Vitest:** `src/test-utils/media.ts` has `setWideScreen()`, reset before each test, behind the existing `matchMedia` mock.
- **Playwright:** a project named `ipad-landscape` (Desktop Chrome at 1180×820 with touch, because Playwright's iPad profiles are WebKit and CI installs only Chromium) runs only `e2e/wide.spec.ts`; the phone project ignores that file. `signedInPage` now waits for either the menu button or the top bar. CI needs no change: `npm run e2e` runs both projects.
- GLOSSARY: added a "Bigger screens" section with **Wide layout** and **Top bar**.
