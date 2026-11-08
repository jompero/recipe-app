# EPIC-10: Wide Layouts (iPad Landscape and Desktop)

Status: ready-for-agent

Replaces "Layout on iPad and desktop needs a look" (left for later in Epic 7) in `docs/backlog.md`. Settled in a grilling session on 2026-11-08. No ADR conflicts: no ADR covers layout or breakpoints. Issue 05 changes `firestore.rules` (the thumbnail size cap), which reaches the live project only through `npm run deploy:rules`.

## Problem Statement

The app was designed for phones, and on an iPad in landscape or a computer it looks stretched. The cookbook shows two huge cards whose 320px thumbnails are blown up and blurry. The grocery list puts each item at one edge of the screen and its amount at the other. The Data page's centred headings sit above left-aligned text. The Plan, the roller and the recipe page use one narrow column when there's room for a month, a week grid, or ingredients beside the method. The single menu button at the bottom centre is a phone pattern that wastes a tap on a big screen.

## Solution

Add one **wide layout** from Mantine's `md` breakpoint (62em, about 992px) up, covering iPad landscape (1024–1366) and desktop. Below that the phone layout stays, with cheap tweaks where they cost nothing (e.g. more cookbook columns on iPad portrait). Wide screens get a sticky **top bar** in place of the menu button. Content is capped at about 1200px, and pages pick narrower columns where text needs them.

Layouts are **prototyped first** (01) on a throwaway branch that never merges, using the real theme and seed data. The owner picks a variant for each page before anything is built.

Three features come last, after the layout stories:
- the Plan's **month view** (wide only)
- **drag and drop** on the Plan (all sizes, including phones)
- grocery **aisle sections** (all sizes)

## Build order

| Issue | Story | Who | Blocked by |
|---|---|---|---|
| 01 Prototype every page | US-10.1 | agent builds, owner picks | none |
| 02 Wide shell: breakpoint, top bar, content cap, iPad e2e | US-10.2 | agent | 01 |
| 03 Data page spacing and wide column | US-10.3 | agent | 01 |
| 04 Cookbook on wide screens | US-10.4 | agent | 02 |
| ~~05 Sharper thumbnails~~ (`wontfix`: 320px kept in 01) | US-10.5 | none | 01 |
| 06 Recipe page in two columns | US-10.6 | agent | 02 |
| 07 Grocery list column and amounts | US-10.7 | agent | 02 |
| 08 Roll week grid | US-10.8 | agent | 02 |
| 09 Plan month view | US-10.9 | agent | 02 |
| 10 Plan drag and drop | US-10.10 | agent, owner checks on iPhone | 09 |
| 11 Grocery aisle sections | US-10.11 | agent | 07 |
| 12 Smoke test on iPad and desktop | US-10.12 | owner | 02–11 deployed |
| 13 Docs sweep | US-10.13 | agent | 12 |

03 and 05 can start once 01 is decided. 04 and 06–09 can go in any order after 02. If 01 keeps 320px thumbnails, 05 becomes `wontfix`. Anything the smoke test finds becomes a new numbered fix issue in this folder, `ready-for-agent`, and 13 waits for it.

## User Stories

1. As a member on an iPad or computer, I want pages to use the screen well, so that the app doesn't look like a stretched phone app.
2. As a member on a wide screen, I want an always-visible top bar with the sections, so that I can change page in one tap.
3. As a member on a wide screen, I want the current page's actions in the top bar, so that they're as easy to reach as on a phone.
4. As a member on a phone, I want the menu button to stay where my thumb expects it, so that nothing I've learned changes.
5. As a member, I want more, smaller cookbook cards on a big screen, so that I can see many recipes at once.
6. As a member, I want sharp cookbook photos on a Retina iPad, so that the cookbook looks good.
7. As a member, I want tag chips to wrap onto lines on a wide screen, so that I don't have to scroll sideways.
8. As a member, I want the A–Z list in columns on a wide screen, so that it doesn't run down one narrow strip.
9. As a member cooking from an iPad, I want ingredients beside the method, with the ingredients staying in view, so that I don't scroll up and down while cooking.
10. As a member, I want a recipe page laid out like a cookbook spread, so that it feels like the Nordic book it is styled on.
11. As a member, I want a month view of the Plan on a wide screen, so that I can plan weeks ahead at a glance.
12. As a member, I want to switch between week and month, with the choice kept in the address, so that Back and reloads keep my view.
13. As a member, I want to drag a planned meal to another day, so that rearranging the Plan is quick.
14. As a member on a phone, I want to long-press a meal to drag it, so that taps still open recipes and swipes still scroll.
15. As a member, I want dragging to work offline like the rest of the Plan, so that the kitchen Wi-Fi doesn't matter.
16. As a member, I want "Move to…" to stay, so that I can move a meal to a day that isn't on screen.
17. As a member, I want the roller's results as a week grid on a wide screen, so that I can see the rolled week as a calendar.
18. As a member, I want the grocery list in a comfortable column with the amount near the item, so that I can read each line at a glance.
19. As a member shopping, I want the merged list sectioned by aisle, so that I walk the shop once.
20. As a member, I want items the app can't place to land in "Other", so that nothing goes missing.
21. As a member, I want the Data page's sections spaced apart and lined up with their headings, so that it reads as tidy sections.
22. As the owner, I want to compare layout prototypes with real data before anything is built, so that we don't build the wrong layout.
23. As the owner, I want CI to catch a broken wide layout, so that a merge doesn't ship a broken iPad view.
24. As the owner, I want phone drag and drop checked on a real iPhone before it merges, so that a clumsy gesture never goes live.

## Implementation Decisions

### Sizes and widths

- **One breakpoint:** Mantine's default `md` (62em, about 992px). The theme keeps Mantine's default breakpoints. Use `visibleFrom` / `hiddenFrom`, responsive props or `useMediaQuery("(min-width: 62em)")` as fits. Use one shared hook or constant for "wide", not scattered literals.
- **Content cap:** the shell caps content at about 1200px, centred. Pages pick narrower columns: Data about 720px, Grocery list about 560px, and the recipe page wider than its current 640px on wide screens (per the variant picked in 01).
- **iPad portrait** (768–834) keeps the phone layout. Cheap tweaks are allowed where they cost nothing (e.g. 3–4 cookbook columns).
- **Out of scope:** Edit/New recipe, Quick Paste, Import, Account and the menu overlay keep their current layout. They just sit inside the shell's cap.

### Navigation

- **Wide screens** get a sticky top bar:
  - section links on the left (Cookbook · Plan · Grocery list · Data · Account) in the Book look: small uppercase italic, current page underlined
  - the current page's actions (from `usePageMenu`) as buttons on the right
- The bottom menu button is hidden on wide screens.
- **Phones** keep the bottom-centre button and the full-screen menu unchanged.
- **Fallback:** if the top bar loses in 01, the wide layout uses the same menu button and overlay, moved to the top right.
- The update banner sits above the bar. The offline strip stays at the bottom. Sticky elements on pages (the roller's action bar) stick below the top bar.

### Prototypes (01)

- Throwaway routes `#/proto/<page>?v=<variant>` on branch `EPIC-10/US-10.1-prototypes`, which **never merges**. They use the real theme, fonts and emulator seed data, behind the usual sign-in.
- The owner views them in desktop Chrome at 1024, 1180 and 1366 (the device toolbar) and in a normal window. No local-network setup for 01.
- The owner's picks are written into this spec ("Prototype picks", below) and into each build issue before it starts.

### Cookbook (04, 05)

- The grid gets 5–6 columns on wide screens (cards about 200–240px), 3–4 on iPad portrait, and stays at 2 on phones. Cards keep the 4/5 aspect.
- Tag chips wrap on wide screens instead of scrolling sideways. The A–Z list flows into 2–3 columns with its letter headings. Search and sort stay where they are.
- **Thumbnails:**
  - Today: 320px, at most 60,000 characters, stored on the recipe doc, capped by `firestore.rules:37`.
  - The prototype makes 480px thumbnails in the browser from the full images so the owner can compare.
  - If 480 wins (05):
    - the compressor's thumbnail size goes up
    - the rules cap goes up (the owner deploys rules **before** the app change merges)
    - the Data page gets a one-off "Regenerate thumbnails" action that rebuilds each thumbnail from its stored full image
  - This adds no Firestore reads, but each cookbook load downloads about twice as much.

### Recipe page (06)

- Two variants in 01:
  - **A:** a full-width photo on top; title and info; then ingredients on the left (sticky while the method scrolls) and method on the right.
  - **N ("Nordic Cookbook", the style reference):** the photo on the left, cropped, at roughly a golden-ratio share of the width (about 38%, not half). On the right, the title and description centred above two columns: ingredients (sticky) and method. This may be too cramped; 01 will show it.
- Scaling, tick-off lines and the wake lock behave as today.

### Plan (09, 10)

- **Month view, wide only:**
  - a Week/Month switch with the view in the URL: `?view=month&month=YYYY-MM`, alongside today's `?week=`
  - wide screens open on Month
  - Monday-first weeks, ‹ month › navigation, and a "Today" button when away from the current month
  - phones keep the week view and the date-picker modal
- **Month cells:** 01 compares titles only (small italic, ellipsis, "+N more" when crowded) with a tiny thumbnail beside each title.
- **Editing in the month view:** "+" in each cell opens the existing Add sheet. Each entry's ⋯ menu keeps Move to…, Remove and Scale.
- **Roll… and Grocery list…** keep today's range: the current week if the visible month contains today, otherwise the month's first week.
- **Drag and drop (10):**
  - in the month view and the week view, at **all sizes, including phones**, with `dnd-kit` (check the current package, version and maintenance status before adding it)
  - mouse drag on desktop, long-press about 300ms with a small movement allowance on touch; a quick tap still opens the recipe, a swipe still scrolls, and the list auto-scrolls near the screen edges
  - moves between days only: no reordering within a day, and the entry is added to the end of the target day
  - only within the visible week or month; Move to… covers anything farther and stays as the fallback
  - the move uses the same unawaited `src/data` write as Move to…, so it works offline
  - checked on the owner's iPhone over a local-network dev server and emulators before merging

### Roll (08)

- On wide screens the rolled days are a week grid: Mon–Sun columns, one row per week for ranges longer than 7 days, and days outside the range greyed out.
- Each cell shows the day, any meals already planned, and the pick, with Lock and Skip.
- From/To, tags and Roll/Save/Discard sit in a bar above the grid, sticky below the top bar. Phones are unchanged.

### Grocery list (07, 11)

- **Wide:** one centred column of about 560px.
- **Amount placement, all sizes:** 01 compares "potatoes · 2 kg" (amount right after the name) with "2 kg potatoes" (amount first). The winner replaces today's space-between row everywhere.
- **Aisles (11), all sizes, merged view only:**
  - a static keyword→aisle table in `src/groceries/` next to the synonym table, keyed on the merge key
  - fixed order: Produce, Bakery, Dairy, Meat & fish, Dry goods, Frozen, Other; unknowns go to Other
  - no schema or rules change; fixes happen by editing the table
  - the by-recipe view is unchanged

### Data page (03)

- **All sizes:** more space between the five sections.
- **Wide:** a centred column of about 720px. Headings stay centred (the theme's Title style is unchanged), so the narrow column is what lines them up with the text.

### Testing

- **New Playwright project** at iPad landscape (1180×820, Chromium). It runs a small tagged subset: the top bar navigates to each section, and one check per page that renders in its wide layout. The full suite stays on `phone-chromium`. Each layout story adds its page check.
- **Vitest:** `matchMedia` is mocked to `matches: false` (`vitest.setup.ts`). Wide components need a way to fake "wide" in tests; add it in 02.

## Prototype picks

Decided by the owner on 2026-11-08, from the prototypes on branch `EPIC-10/US-10.1-prototypes` (never merged; see [01](issues/01-prototypes.md)).

| Row | Pick | Affects |
|---|---|---|
| Shell | **Top bar**: links on the left, page actions on the right, content capped at 1200px. The corner button isn't needed. | 02 |
| Cookbook cards | **M**: `repeat(auto-fill, minmax(210px, 1fr))` from 48em up; 2 columns on phones | 04 |
| Cookbook thumbnails | **320px stays.** The 480px ones averaged about 82 KB each in the prototype (2–3× today's), and the owner found 320px good enough at card size M. | 05 → `wontfix` |
| Recipe | **N, the Nordic spread**: the photo on the left at 38.2%, sticky at full screen height; on the right, the title, source, description and meta centred, then ingredients (42%, sticky) and method. No photo: falls back to A (photo-less header above two columns). | 06 |
| Plan month cells | **Thumbnails**: a 26px thumbnail plus the title (ellipsis), up to 3 entries, then "+N more" | 09 |
| Roll | **Week grid**: cells with a 4/3 photo, a two-line title, and Lock / Skip side by side; From/To on the left and Roll/Save/Discard on the right of a sticky bar | 08 |
| Grocery amount | **"potatoes · 2 kg"**: the amount dimmed and smaller, right after the name, at all sizes | 07 |
| Grocery column | **560px** | 07 |
| Data | **Column + dividers**: a 720px column on wide screens, `xl` gaps, a short centred divider between sections, and the page title as `order={1}` with `pt="xl"` | 03 |

## Testing Decisions

- Pure logic gets unit tests: the month grid's dates, the Roll week rows, the aisle lookup and ordering.
- Layout gets component tests where behaviour changes with width (top bar vs button, which view opens), plus the iPad Playwright subset.
- Drag and drop gets a component or e2e test with the mouse sensor. The touch long-press is checked by hand on a real iPhone (10).

## Out of Scope

- Edit/New recipe, Quick Paste, Import and Account layouts; the menu overlay's design.
- Drag across weeks or months, reordering within a day.
- Aisle overrides by members, aisles stored in Firestore.
- Keyboard shortcuts, hover-only features.
- Android (still untested).
