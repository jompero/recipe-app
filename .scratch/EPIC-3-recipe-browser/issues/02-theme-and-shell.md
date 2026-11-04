# 02: Theme and app shell

Status: done
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

- [x] Component tests with `src/data` faked: the overlay lists the current page's actions plus the three sections; choosing a section navigates and closes it; Back closes it; it shows on a bare `#/` start and not on a deep link.
- [x] Component test: the Account page shows the member's email and signs out.
- [x] Existing session-screen and Data page tests still pass. Check with `VITE_FIREBASE_API_KEY= npx vitest run --project app`.
- [x] By hand on the owner's phone: the theme looks as agreed, and phone Back closes the overlay.

## Comments

**2026-11-04 (agent):** Built test-first at the agreed seam: the whole app at a URL (`renderApp` in `src/test-utils/renderApp.tsx`, the real route tree in a memory router, `src/data` faked, `back()` for phone Back). The theme was checked by hand only, as agreed.

- **Router:** switched to `createHashRouter` (agreed with the owner). The route tree lives in `src/routes.tsx` and `main.tsx` mounts it; the hash URLs are unchanged. React Router 8.5.1's own type docs mark `ScrollRestoration` and `useBlocker` as data-mode only, which is why the switch was needed for 03 and 05. ADR-0004 has an update note.
- **Overlay:** the open overlay is a history entry (`location.state.menu`), so Back closes it. Choosing a page replaces that entry, so Back from the new page returns to the page that was under the overlay. Choosing the page that's already underneath (same path and query) just closes it. A fresh start at bare `#/` opens it once per app load. Escape also closes it (it's a Mantine full-screen `Modal`).
- **Page actions:** pages call `usePageActions([{ label, to }])` (`src/components/pageActions.ts`). Only `to` (navigate) actions exist so far; 06 will add a callback action for Archive's confirmation. The placeholder cookbook already offers *New recipe* (route arrives in 05) and *Show archived* (`/?archived=1`).
- **Account page** at `#/account`: avatar, name, email, *Sign out*. The member reaches pages through the router outlet's context (`useMember()`). Epic 1's header is gone.
- **Theme:** `src/theme.ts` holds variant A: EB Garamond text, Cormorant titles (centred, italic, uppercase, letter-spaced), Jost labels and buttons, near-black `#1d1d1b`, and a `linen` primary palette with shade 6 = `#4f5d4a`. Fonts are bundled (`@fontsource-variable/*`, imported in `main.tsx`).
- The bottom button shows on every member page for now. The edit page (05) will replace it with its Save / Cancel bar.
- Test helpers: `renderApp` sits in its own file because it imports the whole route tree, so callers must fake every `src/data` module the pages use.

**2026-11-04 (owner):** checked on the phone (theme, menu, Back), then merged PR #20.
