# 02: Phone polish: input zoom, open on the cookbook, Roll in reach

Status: done
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

- [x] Every text field a member types into is at least 16 px on a phone-sized touch screen (check in the browser's device mode: computed font size).
- [x] A fresh load of `/` (and of `#/`) shows the cookbook with the menu closed. Test added or updated.
- [x] On the roller with a 7-day range at phone size, Roll again is on screen without scrolling. Test covers its placement where practical.
- [x] `npm run check` and `npm run e2e` pass.
- [x] The smoke test (07) has the phone checks for all three.

## Comments

**2026-11-07 (agent):** Merged in PR #61.
- **No zoom:** one CSS-module class on Mantine's `Input` through the theme: `@media (pointer: coarse) { font-size: max(16px, var(--input-fz)) }`. TextInput, Textarea, TagsInput and the roller's date fields all get it. Desktop keeps the Book size, larger fields keep theirs (the cookbook search is 18px, not the 17px the backlog guessed), and the viewport tag is unchanged.
- **Open on the cookbook:** the start-up effect that opened the menu is gone.
- **Roll in reach:** Roll, Save and Discard sit above the days in a bar that sticks to the top. It isn't at the bottom because the menu button is there.
- Tests: a new e2e test (`e2e/phone-polish.spec.ts`, Pixel 7 touch profile) checks all three in a real browser, plus unit tests for the theme class and the roller's bar.

**2026-11-08:** The owner checked all three on an iPhone in the smoke test (07).
