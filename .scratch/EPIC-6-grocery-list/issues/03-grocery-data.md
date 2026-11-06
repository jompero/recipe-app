# 03: Grocery list data module, rules and backup

Status: ready-for-agent
Story: US-6.3
Branch: `EPIC-6/US-6.3-grocery-data`
Spec: [../spec.md](../spec.md) (Grocery list data)
Blocked by: none. It uses the source line type from 01; if 01 isn't merged yet, define the type in `src/groceries/` here and let 01 adopt it.

## Touches

- New: `src/data/groceries.ts` (+ emulator tests)
- `firestore.rules` and `tests/rules/` (`grocery_lists`)
- `src/data/backup.ts`, **only** if needed to keep the grocery list out of export and restore
- `docs/adr/0008-grocery-list-one-shared-document.md` is already written; change it only if the build differs

If you need to change anything else, stop and ask.

## What to build

- `watchGroceryList(onChange, onError?)`: `onSnapshot` on `grocery_lists/current`. A missing document means an empty list.
- `replaceList(lines)`, `addLines(lines)` (`arrayUnion` with merge), `tick(id)` / `untick(id)`, `addHandLine(raw)` (trimmed, 1–80 characters, `scale: 1`), `removeLines(lines)` (the exact objects, and their ids from `ticked`), `clearList()`.
- Line ids are made in the browser, like Plan entry ids. Each line's shape is checked on read.
- Rules: members may read; they may create and update only `current`; keys `lines`, `ticked` and `updatedAt`; each list at most 600 items; `updatedAt` a timestamp; no delete.

## Acceptance criteria

- [ ] Emulator tests: replace; add; two clients ticking different lines at once both survive; untick; add by hand; remove a recipe's lines and their ticks; clear; the watcher sees another client's tick.
- [ ] Rules tests: members may read and write a valid `current`; another document id, unknown keys, more than 600 lines, a missing or non-timestamp `updatedAt`, and delete are denied; non-members are denied.
- [ ] An export doesn't include the grocery list.
- [ ] `npm run check` passes.
