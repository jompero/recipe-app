# 10: Plan drag and drop

Status: done
Story: US-10.10
Branch: `EPIC-10/US-10.10-drag-and-drop`
Spec: [../spec.md](../spec.md) (Plan)
Blocked by: 09

## What to build

- **Library:** `dnd-kit`. First check the current package name, version, React 19 support and maintenance status against its docs and npm, and note them in Comments. If it doesn't hold up, stop and bring the options back to the owner.
- **Where:** the week view (all sizes, including phones) and the month view (wide).
- **How:**
  - mouse drag on desktop
  - on touch, long-press about 300ms with a small movement allowance before a drag starts, so a quick tap still opens the recipe and a swipe still scrolls; suppress iOS text selection and callouts on the entry during the press
  - the page auto-scrolls near the screen edges while dragging
  - a clear drop target highlight
  - keyboard dragging if the library gives it for free
- **Rules of a drop:**
  - between days only, no reordering within a day; the entry goes to the end of the target day
  - only days on screen
  - dropping on the same day does nothing
- **Write:** the same unawaited `src/data/menu.ts` move that Move to… uses, so it works offline. Move to… stays in the ⋯ menu.
- **Real-phone check:** set up the dev server and emulators on the local network so the owner's iPhone can open them. Write the steps in Comments: the host binding for Vite and the emulators, and how the Auth emulator works from another device.

## Acceptance criteria

- [x] Unit or component test: a drop calls the move with the right days; a same-day drop doesn't.
- [x] Playwright test (mouse): drag an entry to another day in the week view, and in the month view on the iPad project. The two-window live sync test still passes.
- [x] The owner has tried long-press drag on an iPhone over the local network and is happy with tap, scroll and drag (noted in Comments) **before merging**.
- [x] `npm run check` and `npm run e2e` pass.

## Comments

- **2026-11-09, built.** Library: `@dnd-kit/react` + `@dnd-kit/dom` **0.5.3**, pinned exact (pre-1.0). This is the maintained line (the repo's README points at it; last release 31 Oct 2026), with React `^18 || ^19` as peers. The classic `@dnd-kit/core` 6.3.1 hasn't had a release since Dec 2024.
  - `src/plan/drop.ts`: `dropMove` is the rule (another day moves; same day, no day or cancelled does nothing), unit tested. `src/components/planDrag.tsx`: the provider and `DraggableItem` (the entry's `li`); `useDayDrop.ts` makes a day a target, disabled for the entry's own day.
  - Sensors: mouse after 5px of movement (a click still opens the recipe); touch after a 300ms hold with a 5px allowance. The ⋯ button never starts a drag. CSS turns off iOS callouts and text selection on entries.
  - Plugins: dnd-kit's defaults (auto-scroll, no selection while dragging), with a faded copy left in place and no drop animation. The Accessibility plugin is removed: it makes each entry a tab stop with role "button" around its link. So there's no keyboard dragging; Move to… stays the keyboard and screen reader way.
  - The drop calls the same unawaited `moveEntry` as Move to….
  - Real-phone setup: nothing new. README "Testing on your phone" already covers it: `firebase.json` binds both emulators to `0.0.0.0`, `dev:all` runs Vite with the host exposed, and `src/config/firebase.ts` points the Auth and Firestore emulators at the page's own hostname, so the emulator's Google pop-up sign-in works from the phone. Windows firewall allows ports 5173, 9099 and 8080 on a Private network; open `http://<pc-ip>:5173/`.
  - **Owner check on iPhone, 2026-11-09: passed.** "Dragging feels intuitive and like I'm in control." Tap, scroll and long-press drag were tried over the local network.
  - Locally: typecheck, lint and 696 unit tests pass. The emulator and e2e suites weren't run locally because `dev:all` held the ports; they run in CI.
