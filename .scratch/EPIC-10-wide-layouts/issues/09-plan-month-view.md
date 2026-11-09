# 09: Plan month view

Status: done
Story: US-10.9
Branch: `EPIC-10/US-10.9-month-view`
Spec: [../spec.md](../spec.md) (Plan)
Blocked by: 02

## What to build

**Prototype pick (01):** thumbnails in the cells.
- Each entry shows a 26px thumbnail and its title (ellipsis), up to 3 entries, then "+N more". Notes are italic and dimmed, without a thumbnail.
- Days outside the month are tinted, and today has a green top edge.
- In the prototype the "+" and "⋯" buttons took a lot of the cell's width; consider showing them only on hover or focus on devices with a mouse.

- **Wide screens only:** a Week/Month switch on `#/plan`.
  - The view is in the URL: `?view=month&month=YYYY-MM`; the week view keeps `?week=`.
  - Wide screens open on Month when no view is given.
  - Phones ignore `view=month` and show the week.
- **Month grid:** Monday-first, ‹ month › navigation, and "Today" when away from the current month. Today and past days are marked as in the week view.
- Cells show entries per the 01 pick (titles only, or a tiny thumbnail plus title), with "+N more" when crowded.
- "+" in each cell opens the existing Add sheet. Each entry's ⋯ menu keeps Move to…, Remove and Scale.
- **Live data:** listen to the visible month's `menu_days` with `onSnapshot`, as the week does, through `src/data/menu.ts`. Check the read cost (about 35–42 docs per month view) and note it.
- **Menu actions:** Roll… and Grocery list… get the current week if the month contains today, otherwise the month's first week.
- Put the month's dates in `src/plan/` as a pure function.
- GLOSSARY: add **Month view**.

## Acceptance criteria

- [x] Unit tests for the month dates: months starting on Monday and on Sunday, a February, a six-week month.
- [x] Component tests: the switch and the URL; adding from a cell; the ⋯ menu.
- [x] The iPad Playwright subset opens the Plan on Month and adds an entry.
- [x] `npm run check` and `npm run e2e` pass.

## Comments

**2026-11-09 (agent):** Built.
- **Pure helpers:** `src/plan/month.ts` (`monthFromParam`, `monthKey`, `addMonths`, `firstOfMonth`, `monthLabel`, `monthWeeks` on top of `calendarWeeks`, `weekForMonth`), with 10 unit tests covering a month starting on a Monday, one starting on a Sunday (6 weeks), a February that fits 4 weeks, and crossing years.
- **Which view:** `viewFrom()` in `PlanPage` decides. Phones always get the week. On a wide screen, `?view=week|month` wins; otherwise `?week=` means the week, so links from the roller and "Add to plan…" still land on their week; otherwise the month.
  - The month arrows write `?view=month&month=YYYY-MM`, and Today writes `?view=month`.
  - The switch to Week writes `?week=` for `weekForMonth`.
- **One listener** covers the month grid's range (Mon before the 1st to Sun after the end). It reads only the day documents that exist (days with entries), up to 42, once, then changes. A week is up to 7.
- **Cells:** `MonthGrid`/`MonthDay` (`PlanPage.module.css`) reuse the week's day props, and `Entry` gets a `compact` variant: a 26px photo, one line of title with the scale ("Chicken Soup 2×"), notes italic, and the same ⋯ menu (Move to…, Remove, Scale). "+N more" opens that day's week.
- **Mouse vs touch:** with a mouse (`hover: hover` and `pointer: fine`), "+" and "⋯" show only on hover or focus, the ⋯ over the end of the title, which answers the prototype note. On touch screens they always show.
- **`useWide` now reads the width on the first render** (`getInitialValueInEffect: false`). Before, a wide screen rendered the phone layout once first: a flash of the bottom button before the top bar, and the Plan started listening to a week before swapping to the month. The tests caught the second.
- **Tests:** 7 component tests for wide screens plus 1 for phones (`PlanPage.test.tsx`). The iPad e2e check (US-10.9) opens on the month, shows a seeded entry, adds a note with today's "+", and switches to Week. Checked with a Playwright screenshot at 1180×820.
- GLOSSARY: added **Month view**.
