# 14: Drag and drop fixes found by the tests on Windows

Status: done
Story: US-10.14
Branch: `EPIC-10/US-10.14-drag-fixes`
Spec: [../spec.md](../spec.md) (Plan)
Found by: 13 (running `npm run e2e` locally on Windows, after the smoke test passed)

## What was wrong

- **A mouse drag on a recipe started the browser's own link drag** in Chromium on Windows (`dragstart` on the `<a>`), so dnd-kit never took over. CI on Linux didn't show it. Real desktop users on Windows could hit it too; dragging a note, or on touch, was unaffected.
- **The drop target followed the dragged card, not the pointer.** dnd-kit's default collision uses the dragged element's shape, so the highlighted day ran ahead of or behind the finger depending on where the entry was picked up, and a drop on the middle of a day could land on the next one.
- **The e2e drag tests were fragile:** the helper let go before dnd-kit had found the day, and started a second drag while the first was still ending. A rerun (CI retries once) started with the entry already on the target day, so the same entry ID was on two days.

## What changed

- The recipe links in Plan entries are `draggable={false}`.
- Days use `pointerIntersection` from `@dnd-kit/collision` (0.5.3, pinned like the others): the target is the day under the pointer or finger.
- `e2e/drag.ts` waits for the drag to start, for the target day's highlight before letting go, and for the drag to finish. The tests empty their target days first.
- Also: the iPad e2e check for the Data page (US-10.3), left over from 03.

## Acceptance criteria

- [x] `npm run check` (899) and `npm run e2e` (17) pass locally on Windows; the drag tests pass 6 times in a row with `--repeat-each 6`.
- [ ] The owner gives drag a quick try on the iPhone and a desktop after deploy (the target now follows the finger).

## Comments
