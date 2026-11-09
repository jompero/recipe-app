# 12: Smoke test on iPad and desktop

Status: done
Story: US-10.12
Spec: [../spec.md](../spec.md)
Blocked by: 02–11 deployed

## Steps (on the live site)

On an iPad in landscape and portrait, a desktop browser, and an iPhone:

- [x] The top bar shows on the iPad (landscape) and desktop, navigates every section and shows each page's actions. iPad portrait and the iPhone keep the bottom button.
- [x] Cookbook: several cards per row, sharp photos (after Regenerate, if 05 was built), wrapping chips, A–Z in columns.
- [x] Recipe: two columns, ingredients stay in view while the method scrolls, scaling and ticks work, the screen stays awake.
- [x] Plan: opens on Month on the iPad and desktop; add, move (menu and drag), remove; live sync with a second device.
- [x] Drag on the iPhone: long-press drags, a tap opens the recipe, a swipe scrolls.
- [x] Roll: the week grid on the iPad; lock, skip, roll again, save.
- [x] Grocery list: comfortable column, amounts next to items, aisle sections, ticks sync.
- [x] Data page: spaced sections, centred column on the iPad.
- [x] The installed app on the iPad (if installed) behaves the same.

Anything that fails becomes a new numbered fix issue, `ready-for-agent`.

## Comments

- **2026-11-09, passed (owner, quiz mode).** On the live site, after #76 (drag) and #77 (aisles) deployed: top bar, cookbook, recipe, Plan (month view, add, move by menu and drag, remove, live sync), iPhone long-press drag, roll grid, grocery list (column, amounts, aisles, live ticks), Data page, and the installed app on the iPad all good. No fix issues. The only note for later is the one already in the backlog: the recipe spread can feel cramped at 1024px with a photo.
