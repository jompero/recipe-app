# 08: Roll week grid

Status: done
Story: US-10.8
Branch: `EPIC-10/US-10.8-roll-grid`
Spec: [../spec.md](../spec.md) (Roll)
Blocked by: 02

## What to build

**Prototype pick (01):** the week grid.
- Cells have a 4/3 photo (grey without one), a two-line clamped title, and Lock / Skip side by side at the bottom; a locked cell gets a green border.
- The sticky bar has From/To on the left and Roll/Save/Discard on the right; the tags wrap below it.

- **Wide:** `RollPage` shows the rolled days as a grid.
  - Mon–Sun columns, one row per week of the From–To range; days outside the range are greyed out.
  - Each cell shows the day, any meals already planned, then the pick (thumbnail and title) or "Skipped" / "Nothing to pick", with Lock and Skip.
- From/To, tags and Roll/Save/Discard sit in a bar above the grid, sticky below the top bar.
- Put the grid's week-row logic in `src/plan/` as a pure function.
- Phones keep today's list. The roll's sessionStorage state is unchanged.

## Acceptance criteria

- [x] Unit tests for the week rows: a range starting mid-week, a range over two weeks, a single day.
- [x] Component test: the grid renders when wide; lock and skip work from a cell.
- [x] The iPad Playwright subset rolls a week and checks the grid.
- [x] `npm run check` and `npm run e2e` pass.

## Comments

**2026-11-09 (agent):** Built.
- **`calendarWeeks(first, last)`** in `src/plan/week.ts`: the Monday-to-Sunday weeks covering a range, as date keys. Tested mid-week, over two weeks, a single day, across a clock change and a new year, and with bad input. 09's month grid can use it too.
- **`RollPage`** builds the title, dates, tags, buttons and each day's props once, then lays them out two ways:
  - Phones: the list, unchanged.
  - Wide screens: one sticky bar (From/To left, Roll/Save/Discard right) with the tags wrapping below. The grid is labelled "Rolled days", with `RollCell` for days in the range and a greyed `OutsideDay` (`aria-hidden`) for the rest of their weeks.
  - Lock/Skip is now one `DayButtons` component shared by both layouts.
- **Test setup fix:** `vitest.setup.ts`'s `matchMedia` is now a plain function instead of a `vi.fn`. The roller's reduced-motion test spies on it and restores the spy, and restoring a `vi.fn` cleared its implementation, so later tests in the file never saw `setWideScreen()`.
- **Tests:** three component tests (grid and Lock/Skip, the shared sticky bar, wrapping) and the iPad e2e check (US-10.8: 7 cells in one row, 9 over two rows after changing To, Lock works). Checked with a Playwright screenshot at 1180×820.
