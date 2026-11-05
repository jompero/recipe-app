# 02: Add, remove and move entries on the Plan page

Status: ready-for-agent
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

- [ ] Component tests: add a recipe; add a note; empty and too-long notes are refused; archived recipes aren't offered; remove; move calls `moveEntry` with the right dates; the picker marks days with entries.
- [ ] By hand (owner): on a phone over the LAN dev server, add, remove and move entries; a change on the PC shows on the phone.
- [ ] `npm run check` passes.

## Comments
