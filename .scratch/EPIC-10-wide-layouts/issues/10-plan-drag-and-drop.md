# 10: Plan drag and drop

Status: ready-for-agent
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

- [ ] Unit or component test: a drop calls the move with the right days; a same-day drop doesn't.
- [ ] Playwright test (mouse): drag an entry to another day in the week view, and in the month view on the iPad project. The two-window live sync test still passes.
- [ ] The owner has tried long-press drag on an iPhone over the local network and is happy with tap, scroll and drag (noted in Comments) **before merging**.
- [ ] `npm run check` and `npm run e2e` pass.

## Comments
