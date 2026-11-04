# EPIC-3: Recipe Browser

Status: ready-for-agent

Replaces the Epic 3 placeholder in `docs/backlog.md`. Settled in a grilling session on 2026-11-03. **Built after Epic 2**, which provides the final recipe schema (see `.scratch/EPIC-2-pepperplate-import/spec.md`) and the 198 real recipes.

## Problem Statement

Once Epic 2 has run, the shared cookbook is in Firestore, but the app has no way to see it. Members need a fast, phone-friendly way to find a recipe, cook from it in the kitchen, fix what the importer got wrong, and retire recipes they no longer want. The app also still has only a minimal placeholder theme.

## Solution

- Prototype a Nordic editorial cookbook look (reference: a Nordic winter cookbook spread: centred, letter-spaced uppercase italic serif title; italic serif intro; tiny tracked uppercase sans-serif labels for time and yield over a thin rule; plain ingredient list; numbered serif steps; large moody photo). Check it on a phone, then make it the theme.
- Replace the app chrome with **one bottom button** that opens a **full-screen overlay**: actions for the current page, then Cookbook / Data / Account. The overlay is the front screen when the app opens.
- A **cookbook grid** with search, tag filters and sort, all kept in the URL.
- A **recipe page** for cooking: screen kept awake, tick-off lines, scaling.
- An **edit form** (also used blank for **New recipe**), and **archive / unarchive** in place of delete.

## Build order

1. **US-3.1** Design prototype (throwaway)
2. **US-3.2** Theme and app shell (bottom button + overlay)
3. **US-3.3** Cookbook grid
4. **US-3.4** Recipe page
5. **US-3.5** Edit and new recipe
6. **US-3.6** Archive

## User Stories

1. As the owner, I want to see the proposed look on my phone with a few real recipes before it's built for real, so that the design is chosen by seeing it.
2. As a member, I want the app to look like a calm Nordic cookbook, so that browsing feels like reading a book rather than using a tool.
3. As a member, I want pages to show only recipe content, with one small button at the bottom for everything else, so that nothing distracts from the recipe.
4. As a member, I want that button to open a full-screen overlay listing the actions for this page plus Cookbook, Data and Account, so that everything is one tap away.
5. As a member, I want the app to open on that overlay, so that it works as the front page.
6. As a member, I want phone Back to close the overlay, so that it behaves like a native screen.
7. As a member, I want an Account entry showing who I'm signed in as, with Sign out, so that I can switch accounts.
8. As a member, I want a 2-column grid of photo cards with titles, so that I can browse by picture on my phone.
9. As a member, I want a placeholder on cards with no photo, so that the grid stays tidy.
10. As a member, I want to search title, ingredients and tags, ignoring case and accents and matching parts of words, so that "spin" finds everything with spinach.
11. As a member, I want to filter by tag chips, where a recipe must have every selected tag, so that I can narrow down (chicken + salad).
12. As a member, I want to sort A–Z or newest first, so that I can find recently added recipes.
13. As a member, I want search, tags and sort kept in the URL, and the scroll position restored, so that Back from a recipe returns me to exactly where I was and I can share a filtered link.
14. As a member, I want the grid to update live when someone else edits, adds or archives a recipe, so that everyone sees the same cookbook.
15. As a member, I want a recipe page with the full photo across the top (thumbnail first, full photo when loaded), then the title, source (linked if there's a URL), yield and times, tags, description, ingredients and numbered steps with their section headers, so that I can cook from one scrolling page.
16. As a cook, I want the screen to stay awake while a recipe is open, so that my phone doesn't lock with flour on my hands.
17. As a cook, I want to tap an ingredient or step to tick it off, so that I keep my place. Ticks stay on this phone only, survive a reload, and reset when I leave the recipe.
18. As a cook, I want ½ / 1× / 2× / 3× buttons that scale the amounts inside the original ingredient text, shown as friendly fractions, so that I can cook a bigger or smaller batch. Lines with no amount stay unchanged.
19. As a member, I want an "Edit recipe" action in the overlay, so that I can fix any recipe.
20. As a member, I want to edit every text field and the tags (with suggestions from tags already in use), so that imported mistakes can be corrected.
21. As a member, I want to edit ingredients and instructions as one text box each, Pepperplate-style (one line per item, `[Header]` lines for sections), so that editing on a phone is fast.
22. As a member, I want the amounts and units recalculated when I save, so that scaling and the grocery list stay correct.
23. As a member, I want a title to be required and a "Discard changes?" prompt when I leave unsaved edits, so that I don't lose work.
24. As a member, I want a "New recipe" action that opens the edit form blank, so that I can add a recipe by hand before Epic 4.
25. As a member, I want an "Archive" action (with a confirmation) that hides a recipe from the grid and search, so that the cookbook stays tidy without losing anything.
26. As a member, I want a "Show archived" view with Unarchive buttons, so that an archived recipe can come back.

## Implementation Decisions

### Look (US-3.1 → US-3.2)

- **Prototype first:** a throwaway grid + recipe page in the reference style with a few real recipes, opened on the phone over Wi-Fi. Once agreed, the choices go into the single theme module from Epic 1 and the prototype is deleted.
- **Starting direction:** white page, near-black text, generous spacing. Titles in a centred, letter-spaced, uppercase italic display serif. Body text and steps in a book serif. Time, yield and other labels in tiny, tracked uppercase sans-serif over a thin rule. One muted accent, the deep linen green, for buttons and active chips. Photos large, full-bleed on the recipe page.
- **Fonts are bundled** with the app (e.g. via Fontsource), not loaded from a font CDN, so they work offline (Epic 8). Candidates: Cormorant (titles), EB Garamond (text), Jost (labels). The prototype settles them.

### Shell and navigation (US-3.2)

- No header, no tab bar. **One small button fixed at the bottom** of the grid and recipe pages opens a **full-screen overlay** (a state, not its own page).
- Overlay contents, top to bottom:
  - **Page actions:** on a recipe, *Edit recipe* and *Archive* (or *Unarchive*). On the grid, *New recipe* and *Show archived*.
  - **Sections:** *Cookbook*, *Data* (Epic 2's page), *Account*. Calendar and Groceries are added by Epics 5 and 6.
- The overlay **opens over the grid when the app starts**. Choosing Cookbook or pressing Back closes it. A deep link (a recipe, or a filtered grid) opens directly, without the overlay. Phone Back closes the overlay (it pushes a history entry while open).
- **Account** is a page with the member's name or avatar, email, and *Sign out*. This replaces Epic 1's header.
- The edit page has a **Save / Cancel bar** in place of the bottom button.

### Routes (HashRouter)

- `#/`: cookbook grid. Query: `q` (search), `tags` (comma-separated), `sort` (`az` | `new`), `archived=1` (Show archived view).
- `#/recipe/:id`: recipe page. `#/recipe/:id/edit`: edit page. `#/recipe/new`: blank edit form.
- `#/data` (Epic 2) and `#/account`.

### Data (`src/data/recipes.ts`)

- The grid subscribes live (`onSnapshot`) to all recipes and splits active/archived in the browser. That's ~200 recipes with thumbnails embedded, so search, filter and sort are all in-browser.
- The recipe page reads the full image from `recipe_images/{id}` only when opened (ADR-0001), showing the thumbnail until it arrives.
- Saving runs the Epic 2 parsers again on the ingredient and instruction text and writes with `updatedAt: serverTimestamp()`. New recipes get an auto ID, `createdAt`, `archived: false`, `thumbnail: null`, `hasImage: false`.
- **Last save wins.** No conflict warning; the edit form keeps its own draft while the live data changes underneath.
- Archive and unarchive set `archived` and `updatedAt`. Nothing in the app deletes recipes.

### Search, filter, sort (US-3.3)

- Text is normalised (lowercase, accents removed). A recipe matches if the query is a substring of its title, any ingredient's `raw` text, or any tag. Description and instructions aren't searched. No fuzzy matching or search library.
- Tag chips are all tags in use, sorted by count. Selecting several means a recipe needs **all** of them.
- Sort: A–Z by title (locale-aware) or newest `createdAt` first. Imported recipes share their import date.
- Shows loading placeholders, and a "No recipes match" message with a clear-filters action.

### Recipe page (US-3.4)

- One scrolling page, layout as in user story 15. Section headers are kept in both lists; steps are numbered.
- **Wake Lock:** requested while the page is visible, re-requested when the page becomes visible again, released on leave. If it isn't supported, nothing happens.
- **Ticks:** per recipe in `sessionStorage`, cleared when you leave the recipe.
- **Scaling:** not saved. For lines with a parsed `qty`, multiply `qty` (and `qtyMax`), format it as a friendly fraction (¼, ⅓, ½, ⅔, ¾ or a sensible decimal for metric amounts) and replace only the amount at the start of `raw`. Lines without `qty` are shown unchanged.

### Edit (US-3.5)

- Fields: title (required), description, source, source URL, yield, active time, total time, tags (chips with autocomplete from tags in use, saved in lowercase), ingredients text box, instructions text box.
- The text boxes use the Pepperplate syntax (one line per item, `[Header]` for a section) and convert to and from the stored lists with the Epic 2 parsers. Converting to text and back must not change anything.
- Photos can't be changed until Epic 4. Parsed amounts can't be hand-corrected until Epic 6, if ever.
- Leaving with unsaved changes asks "Discard changes?", including via phone Back.

## Testing Decisions

- No end-to-end browser tests yet. Revisit in Epic 5, where live sync across devices is the risky flow.
- Pure logic gets unit tests: search normalisation and matching, tag filtering, sorting, URL ↔ filter state, scaling and fraction formatting, and text ↔ list conversion for the edit form (including the round trip).
- Component tests (React Testing Library) with `src/data` faked at the seam: overlay contents per page, Back closing the overlay, grid filtering, recipe page rendering and ticks, the edit form's validation and discard prompt, archive and unarchive.
- Data module tests against the emulator: the live list, save with reparse, new recipe defaults, archive/unarchive.
- Rules: no new rules beyond Epic 2's shape validation; check that edits from the form pass it.
- Checked by hand on a real phone: the look, Wake Lock, overlay and Back, scroll position restore.

## Out of Scope

- Changing photos and the camera/upload UI; Quick Paste; the bookmarklet (Epic 4).
- Hand-correcting parsed amounts; unit conversion (Epic 6).
- Permanent delete.
- Conflict warnings or merging for simultaneous edits.
- Showing who created or edited a recipe (Epic 2 dropped the "by" fields).
- Fuzzy or typo-tolerant search; searching descriptions and instructions.
- End-to-end browser tests.
- PWA install and offline indicators (Epic 8).

## Further Notes

- How the calendar shows archived recipes that are already on the menu is a question for Epic 5.
- When Epic 3 is done, update `docs/backlog.md` and the "Status" section of `CLAUDE.md`.
