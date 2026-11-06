# 02: Scale on Plan entries

Status: ready-for-agent
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

- [ ] Emulator tests: setting a scale keeps the id and the other entries; setting 1× removes the field; moving keeps the scale; `isEntry` rejects an entry with a bad `scale`.
- [ ] Component tests: the badge shows; the Scale menu calls `setEntryScale` with the right value.
- [ ] Existing `menu_days` documents with no `scale` read as 1×.
- [ ] `npm run check` passes.
