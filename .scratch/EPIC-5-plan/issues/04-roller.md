# 04: The roller

Status: done
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

- [x] Unit tests: every picking rule above with a seeded random source; the state round trip, and a corrupt or old stored value is ignored.
- [x] Emulator test: `saveRoll` adds to several days, including one that already has entries.
- [x] Component tests: lock and skip survive a roll; Save sends only Rolled and Locked days; Discard clears; leaving and coming back restores the roll; the range limit; reduced motion shows results at once.
- [x] By hand (owner): on a phone, the shuffle feels right.
- [x] `npm run check` passes.

## Comments

- 2026-11-05 (agent): Built on `EPIC-5/US-5.4-roller`.
  - **Rules:** `src/plan/roll.ts` (pure): `rollPool`, `rollRows` (tiers: not taken and not planned → not taken → anything), `clampRange`, `rowsForRange`, `rollAdditions`, and `encodeRoll`/`decodeRoll` (versioned; anything damaged, from another version, or whose rows don't match the range is ignored). The random source is `src/plan/random.ts`, so tests fake it there: faking `Math.random` itself broke Mantine's element IDs.
  - **Page:** `#/plan/roll?week=…` from **Roll…** in the Plan's menu. From and To are native date inputs (`type="date"`, good on phones); changing one end moves the other to keep 1–28 days. Tag chips as in the cookbook (any tag matches). Each day shows what it already has ("Planned: …"), the pick (opens the recipe), and Lock / Skip toggles (`aria-pressed`); Lock is disabled with no pick.
  - **Differences from the spec:** the ±14-day Plan days are **watched live** with `usePlanDays` rather than read once, so the "Planned:" lines stay current and no extra read function was needed. New days (first open, or a longer range) get picks as soon as the recipes and nearby days are known, set during render (React's pattern for state that follows other data; the lint rules don't allow setting it from an effect). Rolled days keep their picks when the tags change, until Roll is pressed.
  - **Save** sends one `saveRoll` batch (all or nothing), not awaited (offline), clears the stored roll and replaces the roller with the Plan at the range's first week. A failed save only goes to the console, because the page has already left: the Plan then simply doesn't show the meals. Worth a better message if it ever happens (the only likely cause is a day reaching 20 entries).
  - **Shuffle:** 500 ms of titles stepping through the pool every 70 ms, Roll and Save disabled meanwhile; none with `prefers-reduced-motion`.
  - Typecheck, lint and all 646 tests pass, run against the owner's running emulator. The by-hand phone check (does the shuffle feel right) is left for the owner.

**2026-11-05 (owner):** Manual review passed. PR #41 merged.
