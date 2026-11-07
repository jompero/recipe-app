# 02: Phone polish: input zoom, open on the cookbook, Roll in reach

Status: ready-for-agent
Story: US-9.2
Branch: `EPIC-9/US-9.2-phone-polish`
Spec: [../spec.md](../spec.md) (Phone polish)
Blocked by: none

Three problems from the Epic 7 smoke test (`docs/backlog.md`, end of the Epic 7 section) that matter more once the app is installed.

## What to build

- **No zoom on focus:** iOS zooms in when a focused text box has text smaller than 16 px, and it stays zoomed. Make text inputs, text areas, selects and similar fields at least 16 px on touch screens, set once in the Mantine theme (`src/theme.ts`), not per component. Keep the Book look on desktop where it doesn't matter. **Don't** touch the viewport tag to block zoom.
- **Open on the cookbook:** a fresh start shows the cookbook instead of opening the menu overlay (`MemberShell`). The menu button and overlay keep working as before.
- **Roll in reach:** on the roller (`#/plan/roll`), the Roll again button can be reached without scrolling down, whatever the number of days: at the top, or sticky. Pick what fits the page and say why under Comments.

## Acceptance criteria

- [ ] Every text field a member types into is at least 16 px on a phone-sized touch screen (check in the browser's device mode: computed font size).
- [ ] A fresh load of `/` (and of `#/`) shows the cookbook with the menu closed. Test added or updated.
- [ ] On the roller with a 7-day range at phone size, Roll again is on screen without scrolling. Test covers its placement where practical.
- [ ] `npm run check` and `npm run e2e` pass.
- [ ] The smoke test (07) has the phone checks for all three.

## Comments
