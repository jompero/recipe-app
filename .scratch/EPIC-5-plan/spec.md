# EPIC-5: Plan (shared meal calendar)

Status: ready-for-agent

Replaces the Epic 5 placeholder ("Yahtzee-Style" Calendar) in `docs/backlog.md`. Settled in a grilling session on 2026-11-05. Terms (Plan, Plan day, Entry, Note, Roll, Lock, Skip) are defined in `GLOSSARY.md`.

## Problem Statement

The household decides what to eat each day out loud or in messages, and nothing remembers it. Members want one shared plan they can all see and change from their own phones. When nobody has an idea, they want the app to suggest meals from the cookbook.

## Solution

A **Plan** page (`#/plan`, listed in the overlay menu next to Cookbook) shows one week, Monday to Sunday, as a list of days going down the screen. Each day holds a short list of **entries**: recipes or short text **notes** ("Leftovers", "Eating out"). Members add, remove and move entries, from the Plan page or from a recipe page. The week on screen updates live when someone else changes it.

A **roller** (`#/plan/roll`) suggests meals for a range of days. Roll, lock the days you like, roll the rest again, then save. Saving only adds meals; it never removes any.

## Build order and parallel work

| Issue | Story | Blocked by |
|---|---|---|
| 01 Plan week view, live sync, data module and rules | US-5.1 | none |
| 02 Add, remove and move entries on the Plan page | US-5.2 | 01 |
| 03 "Add to plan…" from the recipe page | US-5.3 | 02 (shares the date picker and add code) |
| 04 The roller | US-5.4 | 02 |
| 05 Playwright and the live sync test | US-5.5 | 02 (needs a way to add an entry in the UI) |

03, 04 and 05 can be built in parallel once 02 is merged. **The emulator can't be shared** (fixed ports 8080, 9099), so only one worktree at a time, and not while the owner runs `dev:all`, may run `npm run check` or the Playwright tests. The others run `npx vitest run <their files>`, `npm run typecheck` and `npm run lint`, and leave the full check to CI.

## User Stories

1. As a member, I want to see this week's plan on my phone, so that I know what we're eating today and the next few days.
2. As a member, I want to go to the previous or next week, and back to today, so that I can plan ahead and look back.
3. As a member, I want a link to a week, so that the page I share or reload shows the same week.
4. As a member, I want changes made on another phone to appear without reloading, so that we don't plan the same day twice.
5. As a member, I want to add a recipe to a day by searching the cookbook, so that planning is quick.
6. As a member, I want to add a short note to a day ("Leftovers", "Eating out"), so that the plan shows days we don't cook from the cookbook.
7. As a member, I want a day to hold more than one meal, so that a second dish or a guest meal fits.
8. As a member, I want to remove an entry or move it to another day, so that the plan follows real life.
9. As a member, I want to change past days, so that the plan records what we actually ate.
10. As a member, I want to open a planned recipe from the plan, so that I can cook from it.
11. As a member, I want to add the recipe I'm looking at to a date, so that I don't have to find it again on the Plan page.
12. As a member, I want the app to suggest meals for a range of days, so that we're not stuck choosing.
13. As a member, I want to keep the suggestions I like and roll the rest again, so that I end up with a plan I'm happy with.
14. As a member, I want to leave days out of a roll, so that nights out don't get a meal.
15. As a member, I want suggestions limited by tag (e.g. "pasta"), so that I can roll within a theme.
16. As a member, I want rolls to avoid recipes we've had recently or already planned, so that we get variety.
17. As a member, I want to look at a suggested recipe and come back to my unsaved roll, so that I can judge it before saving.

## Implementation Decisions

### Data (`menu_days`)

- One document per date, `menu_days/{YYYY-MM-DD}`, as ADR-0006. The date is the **local calendar date** on the member's device.
- Shape, final from this epic:

  ```jsonc
  // menu_days/{YYYY-MM-DD}
  {
    "entries": [
      { "id": "k3f9x2", "recipeId": "15-min-pulled-oats-mushroom-pasta" },
      { "id": "p81qza", "note": "Leftovers" }
    ],
    "updatedAt": <serverTimestamp>
  }
  ```

- **No `slot`.** A day is an ordered list of entries with no labels. **Notes** are allowed as well as recipes. Both are changes to ADR-0006's shape, recorded in that ADR.
- Each entry has a random `id` (short, made in the browser). It lets the same recipe go on a day twice and keeps every entry distinct, so `arrayRemove` takes away exactly that one.
- Notes are trimmed, non-empty, at most 80 characters.
- **Writes**, all in `src/data/menu.ts` (the only Firebase code, as usual):
  - **Add:** `setDoc(day, { entries: arrayUnion(entry), updatedAt: serverTimestamp() }, { merge: true })`. This creates the day if it doesn't exist and never overwrites someone else's add.
  - **Remove:** `updateDoc(day, { entries: arrayRemove(entry), updatedAt })`, with the exact entry object from the live snapshot.
  - **Move:** one `writeBatch`: remove from the old day and add to the new day, same `id`.
  - **Roll save:** one `writeBatch` with an add for every Rolled or Locked day.
  - None of these need a transaction, so they all work offline and queue in the offline cache.
- **Empty days stay.** Removing the last entry leaves `entries: []`. Deleting the document instead would need a transaction (read, then delete only if still empty), and transactions fail offline; deleting without checking could lose an entry another member just added. Empty documents are a few bytes, and the week query costs one read per document, so this doesn't matter.
- Order within a day is the order entries were added. There's no reordering, because that would rewrite the whole list and the last save would win.
- **Reads:** a range query on the document ID for the week on screen (Monday to Sunday), with `onSnapshot`. Verify the exact query (`orderBy(documentId())` with `startAt`/`endAt`, or `where(documentId(), ">=", …)`) against current Firebase docs before writing it. The roller also reads the ±14-day window around its range once (`getDocs`), for its no-repeat rule.
- **Rules:** `menu_days` gets shape validation like `recipes`: keys only `entries` and `updatedAt`; `entries` is a list of at most 20 items; `updatedAt` is a timestamp; the document ID looks like a date (`^\d{4}-\d{2}-\d{2}$`). Rules can't check every list item, so the data module and its types guard each entry (as with recipe ingredients). Members may not delete `menu_days` documents.
- **Backup:** `menuDays` is already in the export. Restore must still produce documents that pass the new rules (`updatedAt` goes back to a timestamp, as for recipes).

### Plan page (US-5.1, US-5.2)

- Route `#/plan`, and "Plan" in the overlay menu's sections, between Cookbook and Data. The home page stays the Cookbook.
- The week is in the URL: `#/plan?week=YYYY-MM-DD` (that week's Monday). With no `week`, or a value that isn't a date, the page shows the current week. A date that isn't a Monday is moved back to its Monday.
- Header: the date range ("3–9 Nov 2026"), previous and next week arrows, and a "Today" button when another week is showing.
- Each day shows its weekday and date, then its entries, then a "+" button. **Today** is highlighted. **Past days** are dimmed but work the same as any other day.
- **A recipe entry** shows the thumbnail (or a plain placeholder) and title, and opens `#/recipe/:id` when tapped. An archived recipe still shows and opens, with an "archived" mark. A `recipeId` with no recipe behind it (e.g. after a restore) shows "Missing recipe" and can still be removed.
- **A note entry** shows its text in a quieter style.
- Each entry has a small "…" menu with **Remove** and **Move to…**. Remove takes effect at once, with no confirmation, because putting an entry back is quick. Move to… opens the date picker.
- **"+"** opens a sheet with two tabs: **Recipe** (search box over recipes that aren't archived, using the cookbook's title and tag matching; tap one to add) and **Note** (one text field and Add).
- The page reads recipes from the live recipe list that's already loaded (`LiveRecipesProvider`), so showing titles and thumbnails costs no extra reads.
- **Date picker** (shared by Move to… and "Add to plan…"): a month calendar (Mantine's date picker, if it fits the theme; verify the current package and API) that opens on today and marks days that already have entries. It only needs to mark the month on screen, and may use a one-off range read for it.

### "Add to plan…" (US-5.3)

- The recipe page's overlay menu gets **Add to plan…** (archived recipes too). It opens the date picker. Picking a date adds the recipe and shows a short confirmation ("Added to Tue 4 Nov") with a link to that week on the Plan page.

### Roller (US-5.4)

- Reached from **Roll…** in the Plan page's overlay menu. Route `#/plan/roll`. It starts with the week that was on screen as its range.
- Controls: start and end date (at most 28 days), and an optional tag filter (the cookbook's tag chips, for recipes that aren't archived; any selected tag matches).
- One row per day in the range: the weekday and date, any meals already on that day (shown small, for context), and the rolled recipe with three states:
  - **Rolled** (the default): changes on the next roll.
  - **Locked:** keeps its recipe on the next roll.
  - **Skipped:** gets nothing.
- A rolled meal is **added on top of** whatever the day already has.
- Buttons: **Roll** (rolls every Rolled day; on first open the page rolls once by itself), **Save** and **Discard**.
- **Picking rules**, in a pure function with unit tests:
  - The pool is recipes that aren't archived and match the tag filter.
  - A recipe is never picked twice in one roll. Locked days' recipes count as picked.
  - A recipe is not picked if it's already planned on any day from 14 days before the range's start to 14 days after its end (including days inside the range).
  - When the pool runs out, the rule relaxes in order: first allow recipes from the ±14-day window, then allow repeats within the roll. If the pool is empty (e.g. a tag with no recipes), say so and leave the days empty.
  - The random source is passed in, so tests are deterministic.
- **The shuffle:** a Rolled day's title flicks through random titles from the pool for about half a second before landing. With `prefers-reduced-motion`, the result shows at once.
- Each rolled recipe can be tapped to open its recipe page. The unsaved roll (range, tags, rows with their states and recipes) is kept in **`sessionStorage`**, so coming back to `#/plan/roll` restores it. Save and Discard clear it.
- **Save:** one batch that adds every Rolled or Locked day's recipe, then goes to the Plan page at the range's first week. **Discard:** clears the roll and goes back to the Plan page.

### End-to-end tests (US-5.5)

- Add **Playwright** (`@playwright/test`; verify the current version and setup docs). One project: Chromium with a phone-sized viewport. Tests live in `e2e/`, separate from Vitest.
- They run against the Vite dev server and the emulator. Add an npm script that starts the emulator (`firebase emulators:exec`) and runs Playwright, and run it in the CI `check` job after the unit tests. Install the browser in CI with Playwright's own install command, with its system dependencies.
- **Signing in:** the Auth emulator's Google popup can be driven by the test (it shows a fake account form). If that's flaky, sign in through a test-only hook that runs only when `VITE_USE_EMULATOR=true`, and say which one was used in the issue.
- The first test: two browser contexts, both signed in as members and on the same week. Add a note in one; it appears in the other. Then remove it in the second; it disappears from the first.
- The owner's manual check moves to Epic 7 (7.5): live sync between two real phones.

## Testing Decisions

- **Unit:**
  - week maths: the Monday of a date, the week from `?week=`, previous and next week, the range label, local dates around midnight and across daylight saving changes (late March and late October);
  - the roller's picking rules (no repeats, locks, skips, the ±14-day window, relaxing when the pool runs out, empty pool), with a seeded random source;
  - the roll state's `sessionStorage` round trip.
- **Component** (React Testing Library, `src/data` faked):
  - the week view: days and entries, today highlighted, past days dimmed, archived and missing recipes, the week in the URL, the arrows and Today;
  - add a recipe and a note; remove; move; the note length limit;
  - "Add to plan…" calls the add with the chosen date and shows the confirmation;
  - the roller: lock and skip survive a roll, Save sends the right days, Discard clears, leaving and coming back restores the roll, reduced motion shows results at once.
- **Emulator and rules:** add creates a day; two adds to the same day from two clients both survive; remove; move in one batch; remove the last entry leaves `entries: []`; members may read and write valid days; invalid keys, too many entries, a bad document ID, and delete are denied; non-members are denied; a restore of an export with menu days passes the rules.
- **End to end:** the two-window live sync test (US-5.5).
- **By hand:** the Plan page and roller on a phone over the LAN dev server; the shuffle feels right.

## Out of Scope

- Meal slots (breakfast, lunch, dinner) or labels on entries.
- Reordering entries within a day.
- Weighting the roller (favourites, ratings, how often a recipe was cooked).
- Marking a meal as cooked.
- Servings per planned meal (scaling stays on the recipe page).
- The grocery list (Epic 6) and anything offline-specific in the interface (Epic 8).
- WebKit or real-phone end-to-end tests (the phone check is in Epic 7).

## Further Notes

- When Epic 5 is done, update `docs/backlog.md`, the "Status" section of `CLAUDE.md`, and `docs/project/blueprint.md` if anything changed from this spec.
- Epic 6 builds its grocery list from `menu_days` over a date range. Note entries are ignored there.
