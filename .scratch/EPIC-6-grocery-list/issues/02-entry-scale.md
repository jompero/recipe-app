# 02: Scale on Plan entries

Status: ready-for-human
Story: US-6.2
Branch: `EPIC-6/US-6.2-entry-scale`
Spec: [../spec.md](../spec.md) (Scale on Plan entries)
Blocked by: none

## Touches

- `src/data/menu.ts` (+ emulator tests): `MenuEntry` with `scale?`, `isEntry`, a new `setEntryScale`, and `moveEntry` keeping the scale
- `src/components/PlanPage.tsx` and the entry "…" menu (+ tests): the scale badge and the Scale menu
- `docs/adr/0006-menu-one-document-per-date.md` is already amended; change it only if the build differs

If you need to change anything else, stop and ask.

## What to build

- `scale` is `0.5 | 2 | 3`, on recipe entries only; 1× means no field.
- `setEntryScale(date, entry, scale)`: one batch that does an `arrayRemove` of the old entry object, then an `arrayUnion` of the new one with the same `id`. Verify against current Firebase docs that two updates to one document in a batch apply in order. The entry moves to the end of its day; that's accepted.
- Plan page: a "2×"-style badge when the scale isn't 1×. **Scale** in the entry menu offers ½× / 1× / 2× / 3×, with the current one marked. Not awaited, like the other Plan writes.

## Acceptance criteria

- [x] Emulator tests: setting a scale keeps the id and the other entries; setting 1× removes the field; moving keeps the scale; `isEntry` rejects an entry with a bad `scale`.
- [x] Component tests: the badge shows; the Scale menu calls `setEntryScale` with the right value.
- [x] Existing `menu_days` documents with no `scale` read as 1×.
- [x] `npm run check` passes (typecheck, lint and `npm test` against the running emulator: 761 tests).
- [x] By hand (owner): on the Plan, set a recipe to 2× and back to 1×; the badge follows, on another device too.

## Comments

- 2026-11-06 (agent): Built on `EPIC-6/US-6.2-entry-scale`, test-first through the two seams agreed with the owner (`menu.ts` on the emulator, the Plan page with `src/data` faked).
  - **`src/data/menu.ts`:** `EntryScale` (`0.5 | 1 | 2 | 3`), `RecipeEntry` with `scale?` (never 1), `isEntry` skips a recipe entry with any other scale and a note with a scale. `setEntryScale(date, entry, scale)`: one batch with two updates to the same day (`arrayRemove` the old object, `arrayUnion` the new one, same `id`); the emulator test confirms they apply in order. 1× writes the entry without `scale`. `moveEntry` already keeps the scale, since it moves the whole object.
  - **Plan page:** a "2×"/"½×" label after the recipe's title, and a **Scale** section at the bottom of the entry's "⋯" menu. **Different from the issue:** the scale is a `SegmentedControl` (½× / 1× / 2× / 3× in one row, a real radio group) rather than four menu items, because Mantine forces `role="menuitem"` on menu items, so they can't be marked as checked. Picking a scale doesn't close the menu.
  - No rules change: the rules check the `entries` list, not its items (as in Epic 5).
  - `npm run check` itself can't run while the owner's emulators hold the ports, so its three steps were run one by one.

**2026-11-06 (owner):** Checked on the phone over the LAN dev server: the "2×" badge and the Scale row in the entry menu look good.
