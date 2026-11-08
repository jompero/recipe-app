# 08: Roll week grid

Status: ready-for-agent
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

- [ ] Unit tests for the week rows: a range starting mid-week, a range over two weeks, a single day.
- [ ] Component test: the grid renders when wide; lock and skip work from a cell.
- [ ] The iPad Playwright subset rolls a week and checks the grid.
- [ ] `npm run check` and `npm run e2e` pass.

## Comments
