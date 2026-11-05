# EPIC-4: Recipe Input

Status: ready-for-agent

Replaces the Epic 4 placeholder in `docs/backlog.md`. Settled in a grilling session on 2026-11-04/05. **Built after Epic 3**: the US-3.5 edit form (`src/components/EditPage.tsx`, `src/editing/recipeForm.ts`) already does New recipe, validation and saving.

## Problem Statement

Adding a recipe means typing every field into the edit form by hand, and photos can't be added at all. Members find recipes on websites (mostly on a PC) and in messages or notes, and want them in the cookbook in seconds, with a photo.

## Solution

Three new ways to fill the **existing New recipe form**. Each one produces a draft that opens the form already filled in. Nothing is saved until the member presses Save.

- **Photo** in the edit form: pick (camera or library on a phone), paste from the clipboard, or drop a file.
- **Quick Paste:** a page where you paste a whole recipe as text. The app splits it into fields.
- **Bookmarklet:** run on a recipe website (mainly desktop Chrome, Firefox and Edge), it reads the page's `ld+json` Recipe data and opens the app with it as a draft. There is no server and no CORS proxy.

## Build order and parallel work

**2026-11-05: back to one issue at a time in the main workspace.** Issues 01–05 and 07 were built in parallel worktrees. The rest (06, then 08) are built one after another in the main checkout, so the emulator rule below no longer limits anything: run `npm run check` as usual, as long as `dev:all` isn't running. Current state and next steps: [handoff.md](handoff.md).

The work is split so that pure logic can be built at the same time in separate git worktrees. Each issue lists the files it **Touches**. An agent stays within them and asks before changing anything else.

| Issue | Story | Wave | Blocked by |
|---|---|---|---|
| 01 Photo in the edit form | US-4.1 | 1 | none |
| 02 Paste splitter | US-4.2 | 1 | none |
| 03 `ld+json` converter | US-4.3 | 1 | none |
| 04 Bookmarklet script | US-4.4 | 1 | none |
| 05 Paste page and draft into the form | US-4.2 | 2 | 01, 02 |
| 06 Import route, photo fetch, duplicate notice | US-4.3 | 2 | 03, 05 |
| 07 Install page | US-4.4 | 2 | 04 |
| 08 Microdata fallback in the bookmarklet | US-4.4 | 2 | none (04 merged) |
| 09 Largest site photo (follow-up, `needs-triage`) | US-4.3 | later | none |

**The emulator can't be shared.** `npm run test:ci` / `npm run check` start the emulator on fixed ports (8080, 9099). Only one worktree, and not while the owner runs `dev:all`, may run them at a time. Issue 01 is the only wave-1 issue that needs the emulator. The others run `npx vitest run <their files>`, plus `npm run typecheck` and `npm run lint`, and leave the full check to CI on their PR.

## User Stories

1. As a member, I want to add or replace a recipe's photo in the edit form, so that the cookbook has pictures for new recipes.
2. As a member on a phone, I want the photo picker to offer the camera or my photo library, so that I can snap the dish or use an existing picture.
3. As a member on a PC, I want to paste an image I copied ("Copy image") or drop an image file onto the form, so that I can take a photo from a recipe site.
4. As a member, I want to remove a recipe's photo, so that a wrong picture doesn't stay.
5. As a member, I want the new photo saved only when I press Save, so that Cancel leaves the recipe as it was.
6. As a member, I want to paste a whole recipe as text and get a filled-in form to correct, so that recipes from messages and notes are quick to add.
7. As a member, I want Quick Paste to understand English, Danish and Finnish headings, so that my usual sources work.
8. As a member, I want Quick Paste never to drop text it can't place, so that nothing is lost.
9. As a member, I want Back from the filled-in form to return to Quick Paste with my text still there, so that I can adjust it and try again.
10. As a member on a PC, I want to click a bookmark on a recipe website and land in the app with a filled-in form, so that saving a web recipe takes seconds.
11. As a member, I want the website's photo brought in when the site allows it, and clear instructions to copy and paste it when it doesn't, so that the photo is never a dead end.
12. As a member, I want a clear message when a page has no recipe data, so that I know to use Quick Paste instead.
13. As a member, I want a notice when I already have a recipe from the same web address, so that I don't add duplicates.
14. As a member, I want an install page with the bookmarklet and steps for my browser, so that I can set it up without help.

## Implementation Decisions

### The shared path

- Every input ends in the **New recipe form** (`#/recipe/new`), already filled in. Quick Paste and the import route pass the draft in **router location state**: `navigate("/recipe/new", { state: { draft, photoUrl? } })`, where `draft` is a `RecipeDraft` and `photoUrl` an optional image URL to try to fetch (06).
- The form starts filled from the draft, but its "unsaved" baseline stays the **empty form**, so Cancel or Back asks "Discard changes?". If the page reloads, the draft is lost, which is accepted.

### Photo (US-4.1)

- One photo per recipe, as the schema has today: the thumbnail in `recipes/{id}.thumbnail` and the full photo in `recipe_images/{id}` (ADR-0001).
- The photo area in the edit form accepts the **file picker** (`accept="image/*"`, no `capture` attribute), **pasting an image** from the clipboard, and **dropping an image file**. Dragging an image straight from another browser tab is not promised.
- Compression (`src/utils/imageCompressor.ts`) runs as soon as a photo is chosen, and a preview shows. `ImageTooLargeError` shows an error and keeps the previous photo.
- The chosen photo is held in the form and written **only on Save**, in **one batch** with the recipe. A new recipe gets its ID in the browser (`doc(collection(...))`) so a single batch can write both documents. Cancel throws the photo away. A changed or removed photo counts as an unsaved change.
- **Remove:** deletes `recipe_images/{id}` and sets `thumbnail: null` and `hasImage: false`. **Replace:** overwrites both. The rules change to allow members to **delete `recipe_images`**. Recipes still can't be deleted. Recorded in ADR-0001's Consequences.

### Quick Paste (US-4.2)

- Reached from a *Paste recipe* action in the cookbook's overlay, next to *New recipe*. The page has one large text box and a *Make draft* button.
- Splitting rules:
  - **Title:** the first line that isn't empty.
  - **Section headings** (English, Danish, Finnish; matched ignoring case and a trailing `:`), e.g. *Ingredients / Ingredienser / Ainekset / Ainesosat* and *Method / Instructions / Directions / Steps / Preparation / Fremgangsmåde / Sådan gør du / Tilberedning / Valmistus / Valmistusohje / Ohje*. A notes heading (*Notes / Tips / Noter / Vinkit*) adds its lines to the description. Headings are not copied into the result.
  - **Clean-up:** bullets (`•`, `-`, `*`, `–`) and step numbers (`1.`, `2)`) at the start of a line are stripped.
  - **Yield and time:** label lines such as "Serves 4", "Makes 12", "Portioner: 4", "Annokset: 4", "Prep: 15 min", "Total time: 1 hr", "Tid: 30 min" fill yield, active time and total time. Recognised anywhere outside the ingredient and instruction sections.
  - **Nothing is dropped:** other lines between the title and the first heading go to the description.
  - **Sub-headings:** inside a section, a short line ending in `:` (e.g. "For the sauce:") becomes a `[Header]` line.
  - **No headings found:** lines that start with an amount (`splitAmount` in `src/parsing/ingredientLine.ts`) go to ingredients, and the rest go to instructions.
  - Ingredient and instruction lines then go through `textToIngredients` / `textToInstructions` (`src/parsing/blockText.ts`), so amounts are parsed as on Save.

### Bookmarklet and import (US-4.3, US-4.4)

- **The bookmarklet stays minimal; the app does the work.** The bookmarklet:
  - finds the schema.org `Recipe` in the page's `<script type="application/ld+json">` blocks: a single object, an array, or `@graph`, with `@type` as a string or an array;
  - inlines `@id` references (image, author, publisher) from the same graph;
  - with no `ld+json` Recipe, falls back to **schema.org microdata** (`itemtype="…schema.org/Recipe"`), which Valdemarsro uses. Added 2026-11-05 as issue 08; the payload format stays the same;
  - keeps only the fields in `RecipePayload` (`src/import/recipePayload.ts`, the shared contract) plus the page URL;
  - **navigates the same tab** to `<app>#/import?d=<base64url of UTF-8 JSON>`.
- No popup and no `postMessage` (popup blockers and COOP break them).
- **No recipe found:** `alert("No recipe found on this page. Copy the recipe text and use Paste recipe in the app.")`, and the app isn't opened.
- **The app's address** is put into the bookmarklet code by the install page while it runs (origin plus path), so a bookmarklet installed from the dev server opens the dev app and one installed from the live site opens the live app. The bookmarklet source lives in the repo and is minified into the `javascript:` link at build time.
- **Converter** (`RecipePayload` → `RecipeDraft` plus image URL), in the app, unit-tested:
  - text: HTML entities decoded and tags stripped;
  - instructions: a string, an array of strings, `HowToStep`, or `HowToSection` (possibly nested), with sections becoming `[Header]` lines;
  - ingredients: `recipeIngredient`, falling back to legacy `ingredients`;
  - yield: the most descriptive string ("12 cookies" over "12");
  - times: ISO 8601 durations as plain text such as "1 hr 30 min" or "45 min". Active time comes from `prepTime`; total time from `totalTime`, or prep plus cook;
  - source: the publisher's name, else the site's hostname. Source URL: the page URL. Description: `description`;
  - **tags: none** (site keywords are noisy);
  - image URL: the first usable one from a string, an array or an `ImageObject`.
- **Import route** `#/import?d=…`:
  - It decodes and converts the data, **replaces the URL** (so reloading or Back doesn't import again and the long URL leaves history), then opens the New recipe form with the draft.
  - If the member isn't signed in, `d` is kept in `sessionStorage` through sign-in.
  - Unreadable data shows "Couldn't read that recipe" and goes to the cookbook.
- **Photo from a site:** the form tries `fetch(photoUrl)` and the normal compression. Most sites send no CORS header, so failure is expected. Then the form shows "Couldn't fetch the photo: copy the image on the site and paste it here", with a link that opens the image.
- **Duplicate notice:** in the form, whenever the source URL matches an existing recipe's (archived ones included), show "You already have this recipe" with a link to it. It doesn't block saving. URLs are compared ignoring protocol, `www.`, query, fragment and a trailing slash.
- **Install page:** a section on the Data page with:
  - a draggable link for the desktop bookmarks bar;
  - the code with a Copy button;
  - short steps for desktop Chrome, Firefox and Edge, and for iOS Safari and Android Chrome;
  - a note that Safari (Mac and iPhone) won't run it on sites with a strict Content Security Policy.

### Research behind the bookmarklet (2026-11-04)

- Desktop Firefox (since v69) runs bookmarklets despite page CSP, and Chrome generally does too. Safari applies CSP to bookmarklets ([WebKit bug 156106](https://bugs.webkit.org/show_bug.cgi?id=156106), open since 2016).
- iOS install: bookmark any page, then edit its URL to the code. Android Chrome: run it by typing the bookmark's name in the address bar.
- URL hash: recipe JSON of ~2–20 KB is safe in every browser. Chrome allows up to 2 MB. iOS Safari has no documented limit, so don't send image bytes through the hash.
- In a live test of 8 sites, only 2 image hosts sent `Access-Control-Allow-Origin` (BBC Good Food, NYT Cooking). Most `@graph` users are WordPress (Yoast, WPRM).
- Web Share Target is Android-only, needs an installed PWA, and shares only the URL, so it's no use without a server.

## Testing Decisions

- **Unit:**
  - the paste splitter, with English, Danish and Finnish samples, the no-headings fallback and the nothing-dropped rule;
  - the converter, against **small hand-trimmed `ld+json` fixtures from 5–6 real sites** (`@graph`, sections, plain-string steps, entities, array yields, `ImageObject`);
  - duration formatting;
  - the bookmarklet's extraction run in jsdom on fixture HTML, including no recipe found;
  - base64url round trip with non-ASCII text (æøå, äö).
- **Component** (React Testing Library, `src/data` faked):
  - photo pick, paste, drop, remove and the too-large error;
  - paste page → filled-in form → Back keeps the text;
  - the filled-in form asks to discard;
  - the import route with good and bad data, and the URL replaced;
  - photo fetch failure shows the fallback;
  - the duplicate notice;
  - the install page renders a link containing the app's address.
- **Emulator and rules:** save with a new photo (new and existing recipe); replace and remove a photo; members may delete `recipe_images` and non-members may not; deleting a recipe is still denied.
- **By hand:** the bookmarklet in desktop Chrome and Firefox on ~5 sites the owner uses (Valdemarsro among them); Ctrl+V of a copied image; one phone check of the photo picker and the bookmarklet.
- Still no end-to-end browser tests (revisit in Epic 5).

## Out of Scope

- Several photos per recipe; cropping or rotating.
- Any server, proxy or Cloud Function to fetch pages or images.
- Web Share Target and an iOS Shortcut (possible later, after Epic 8).
- Tags taken from site keywords or categories.
- Importing from a pasted URL (would need a proxy).
- Making the bookmarklet work on Safari sites with a strict CSP.

## Further Notes

- When Epic 4 is done, update `docs/backlog.md`, the "Status" section of `CLAUDE.md`, and ADR-0001 (if 01 hasn't already).
- The Pepperplate parsers were written for that export. Unit spellings like "tlk" aren't recognised yet (noted for Epic 6).
