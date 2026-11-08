# 02: Wide shell: breakpoint, top bar, content cap, iPad e2e

Status: ready-for-agent
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

- [ ] At 1180×820 the top bar shows, navigates to every section and shows the page's actions. At phone width the bottom button and overlay are unchanged.
- [ ] Component tests cover top bar vs button by width.
- [ ] The iPad Playwright project runs in CI with the navigation test.
- [ ] `npm run check` and `npm run e2e` pass.

## Comments
