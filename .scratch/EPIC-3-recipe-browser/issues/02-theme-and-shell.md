# 02: Theme and app shell

Status: ready-for-agent
Story: US-3.2
Branch: `EPIC-3/US-3.2-theme-and-shell`
Spec: [../spec.md](../spec.md)
Blocked by: 01

## What to build

- **Theme:** the look agreed in 01 (variant A, "Book"; see the spec's "Look" section) goes into `src/theme.ts` (Mantine `createTheme`), replacing Epic 1's placeholder. Fonts bundled via `@fontsource-variable/cormorant` (with its `wght-italic.css`), `@fontsource-variable/eb-garamond` and `@fontsource-variable/jost`. Reference: `src/components/prototype/` on branch `prototype/EPIC-3-US-3.1-design`. That code isn't merged; rewrite it properly.
- **Shell:** `MemberShell`'s header goes. One small button fixed at the bottom of content pages opens a **full-screen overlay**, which is UI state, not a route.
- **Overlay contents:** page actions on top (each page supplies its own, e.g. via context; the grid and recipe pages fill them in 03–06), then the sections *Cookbook*, *Data*, *Account*.
- **Opens on start:** when the app opens at `#/` with no query, the overlay shows over the grid. A deep link (a recipe, or a filtered grid) opens without it. Choosing *Cookbook* or pressing Back closes it.
- **Back closes the overlay:** opening it pushes a history entry, and Back pops it. Check how this fits React Router 8 (`react-router` `^8.5.1`) against its current docs.
- **Account page** at `#/account`: name or avatar, email, *Sign out* (moved from Epic 1's header).
- `#/` keeps the placeholder home until 03 builds the grid. `#/data` stays, reached from the overlay.

## Acceptance criteria

- [ ] Component tests with `src/data` faked: the overlay lists the current page's actions plus the three sections; choosing a section navigates and closes it; Back closes it; it shows on a bare `#/` start and not on a deep link.
- [ ] Component test: the Account page shows the member's email and signs out.
- [ ] Existing session-screen and Data page tests still pass. Check with `VITE_FIREBASE_API_KEY= npx vitest run --project app`.
- [ ] By hand on the owner's phone: the theme looks as agreed, and phone Back closes the overlay.

## Comments
