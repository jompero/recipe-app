# 01: Plan week view, live sync, data module and rules

Status: ready-for-agent
Story: US-5.1
Branch: `EPIC-5/US-5.1-week-view`
Spec: [../spec.md](../spec.md) (Data, Plan page)
Blocked by: none

## Touches

- New: `src/data/menu.ts` (+ emulator tests), a pure week-maths module (+ unit tests), `src/components/PlanPage.tsx` (+ tests)
- `firestore.rules` and `tests/rules/` (`menu_days` shape validation)
- `src/routes.tsx`, `src/components/MemberShell.tsx` (the "Plan" section, between Cookbook and Data)
- `src/data/backup.ts`, **only** if restored menu days don't pass the new rules

If you need to change anything else, stop and ask.

## What to build

- **`src/data/menu.ts`:**
  - the `MenuEntry` type (`{ id, recipeId } | { id, note }`) and a helper that makes entry IDs;
  - `watchWeek(monday, onChange)`: a document-ID range query with `onSnapshot` (verify the query form against current Firebase docs);
  - `addEntry(date, entry)`: `setDoc` with merge, `arrayUnion` and `serverTimestamp()`;
  - `removeEntry` (`arrayRemove` of the exact entry) and `moveEntry` (one batch), so 02 only needs UI.
- **Rules:** keys only `entries` and `updatedAt`; `entries` a list of at most 20; `updatedAt` a timestamp; the document ID matches `^\d{4}-\d{2}-\d{2}$`; no delete.
- **Week maths:** the Monday of a local date; `?week=` parsing (missing or invalid → this week; not a Monday → its Monday); previous and next week; the range label ("3–9 Nov 2026", "29 Dec 2025 – 4 Jan 2026").
- **Plan page at `#/plan`:**
  - the header with the range, arrows and Today;
  - seven days with weekday and date; today highlighted; past days dimmed;
  - recipe entries (thumbnail and title from the live recipe list, a link to the recipe, the "archived" mark, the "Missing recipe" fallback) and note entries, read-only for now;
  - page name "Plan" via `usePageMenu`.

## Acceptance criteria

- [ ] Unit tests: week maths, including around midnight and both daylight saving changes.
- [ ] Emulator tests: add creates the day; two clients adding to the same day both survive; remove; move; removing the last entry leaves `entries: []`; `watchWeek` sees another client's add.
- [ ] Rules tests: valid days allowed for members; extra keys, more than 20 entries, a bad ID, a missing or non-timestamp `updatedAt`, and delete are denied; non-members denied; a restore of an export with menu days passes.
- [ ] Component tests: the week from the URL, arrows and Today, today and past styling, archived and missing recipes.
- [ ] `npm run check` passes.

## Comments
