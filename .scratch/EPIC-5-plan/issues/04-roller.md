# 04: The roller

Status: ready-for-agent
Story: US-5.4
Branch: `EPIC-5/US-5.4-roller`
Spec: [../spec.md](../spec.md) (Roller)
Blocked by: 02

## Touches

- New: a pure roll module (picking rules, roll state and its `sessionStorage` round trip, + unit tests), `src/components/RollPage.tsx` (+ tests)
- `src/data/menu.ts`: a one-off range read for the ±14-day window, and `saveRoll` (one batch of adds), + emulator tests
- `src/components/PlanPage.tsx` (the "Roll…" overlay action), `src/routes.tsx`

If you need to change anything else, stop and ask.

## What to build

- **`#/plan/roll`**, from **Roll…** on the Plan page, starting with the week that was on screen.
- Start and end date (at most 28 days), and an optional tag filter (any selected tag matches).
- One row per day: existing meals shown small, the rolled recipe, and Rolled / Locked / Skipped. A rolled meal is added on top of existing ones.
- **Roll** re-rolls Rolled days (the page rolls once by itself on first open). **Save** adds every Rolled or Locked day's recipe in one batch and goes to the Plan page at the range's first week. **Discard** clears the roll and goes back.
- **Picking rules** (pure, random source passed in):
  - recipes that aren't archived and match the tags;
  - no recipe twice in one roll (locked days' recipes count);
  - nothing planned from 14 days before the start to 14 days after the end;
  - when the pool runs out, allow the window first, then repeats;
  - an empty pool says so and leaves the days empty.
- **Shuffle:** about half a second of flicking titles on Rolled days; instant with `prefers-reduced-motion`.
- The unsaved roll lives in `sessionStorage` and comes back when the member returns to `#/plan/roll` (e.g. after opening a rolled recipe). Save and Discard clear it.

## Acceptance criteria

- [ ] Unit tests: every picking rule above with a seeded random source; the state round trip, and a corrupt or old stored value is ignored.
- [ ] Emulator test: `saveRoll` adds to several days, including one that already has entries.
- [ ] Component tests: lock and skip survive a roll; Save sends only Rolled and Locked days; Discard clears; leaving and coming back restores the roll; the range limit; reduced motion shows results at once.
- [ ] By hand (owner): on a phone, the shuffle feels right.
- [ ] `npm run check` passes.

## Comments
