# 09: Plan month view

Status: ready-for-agent
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

- [ ] Unit tests for the month dates: months starting on Monday and on Sunday, a February, a six-week month.
- [ ] Component tests: the switch and the URL; adding from a cell; the ⋯ menu.
- [ ] The iPad Playwright subset opens the Plan on Month and adds an entry.
- [ ] `npm run check` and `npm run e2e` pass.

## Comments
