# 02: Add, remove and move entries on the Plan page

Status: in-review
Story: US-5.2
Branch: `EPIC-5/US-5.2-edit-entries`
Spec: [../spec.md](../spec.md) (Plan page)
Blocked by: 01

## Touches

- `src/components/PlanPage.tsx` (+ tests)
- New: the add sheet (Recipe and Note tabs), the entry "…" menu, a shared date picker component for Move to… (also used by 03), each with tests
- `src/cookbook/cookbook.ts`, **only** to export its title and tag matching for the recipe search, if it isn't reusable as is
- `package.json`, **only** if the date picker needs `@mantine/dates` (verify the current package and API first)

If you need to change anything else, stop and ask.

## What to build

- **"+" on each day** opens a sheet:
  - **Recipe** tab: search over recipes that aren't archived; tap one to add it;
  - **Note** tab: one field (trimmed, 1–80 characters) and Add.
- **Entry "…" menu:** **Remove** (at once, no confirmation) and **Move to…** (date picker → `moveEntry`).
- **Date picker:** a month calendar that opens on today (for Move to…, on the entry's day) and marks days in the visible month that already have entries.
- Past days work the same as other days.

## Acceptance criteria

- [x] Component tests: add a recipe; add a note; empty and too-long notes are refused; archived recipes aren't offered; remove; move calls `moveEntry` with the right dates; the picker marks days with entries.
- [ ] By hand (owner): on a phone over the LAN dev server, add, remove and move entries; a change on the PC shows on the phone.
- [x] `npm run check` passes.

## Comments

- 2026-11-05 (agent): Built on `EPIC-5/US-5.2-edit-entries`.
  - **"+"** next to each day's heading opens `AddEntrySheet` (Recipe / Note tabs). The recipe search is the cookbook's `selectRecipes` with only `q` set, so archived recipes are left out and matching is the same as the cookbook's. The note shows a count, and an error only once it's over 80; Add stays disabled while empty.
  - **"⋯"** on each entry: Move to… and Remove. The rules for notes moved to `src/plan/note.ts` (`NOTE_MAX`, `noteProblem`), shared by the form and `menu.ts`.
  - **`PlanDatePicker`** (for 03 as well): Mantine's `DatePicker` from `@mantine/dates` 9.7.4 (matches `@mantine/core`; its peer `dayjs` added). It watches the month on screen with `usePlanDays` only while open; days with entries get a dot and ", has meals" in their label. Move to… opens on the entry's day, shown as selected.
  - **Writes aren't awaited.** Firestore's write promise only settles when the server confirms, which never happens offline, so the sheet closes at once and the live week shows the change. A failure shows "Couldn't save the change" above the week.
  - **Beyond Touches:** `src/main.tsx` imports `@mantine/dates/styles.css` (needed by the picker). The bundle grew by ~92 kB (~25 kB gzipped) for `@mantine/dates` and `dayjs`.
  - Typecheck, lint and all 600 tests pass, run against the owner's running emulator (the test projects are separate from `demo-recipe-app`). The by-hand phone check is left for the owner.
