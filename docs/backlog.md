# Project Backlog: Shared Serverless Recipe Planner

> **Placeholder draft.** Epic order and architecture were settled in the Nov 2026 plan review (see `docs/adr/`). The story list in each epic is **not** settled scope: each epic gets grilled one at a time and replaced by a spec under `.scratch/`. Story IDs may change when that happens.
>
> **Local-first:** Epics 1–6 are built entirely against the Firebase Emulator. Nothing touches real Firebase or GitHub Pages until Epic 7 ([ADR-0007](adr/0007-local-first-until-go-live.md)).

---

## Epic 1: Local Foundation
**Goal:** A working local development setup with checks enforced from the first commit.

**Specified:** see [`.scratch/EPIC-1-local-foundation/spec.md`](../.scratch/EPIC-1-local-foundation/spec.md) (stories US-1.1 to US-1.6, built in the order 1.5, 1.1, 1.4, 1.2, 1.3, 1.6).

---

## Epic 2: Pepperplate Import
**Goal:** Get the 198 seed recipes into the final format, so the later epics are built against real data.

**Done** (2026-11-03): see [`.scratch/EPIC-2-pepperplate-import/spec.md`](../.scratch/EPIC-2-pepperplate-import/spec.md) and its per-story issues (US-2.1 to US-2.7). The image compressor moved here from 4.3.

---

## Epic 3: Recipe Browser
**Goal:** A fast, phone-friendly way to explore the shared cookbook.

**Done** (2026-11-05): see [`.scratch/EPIC-3-recipe-browser/spec.md`](../.scratch/EPIC-3-recipe-browser/spec.md) and its per-story issues (US-3.1 to US-3.6). Beyond the spec: an A–Z list view next to the grid (from the prototype), and the menu names the current page. The earlier plan to add Playwright tests here was dropped in the Epic 3 grilling; revisit end-to-end tests in Epic 5. The phone check that the screen stays awake moved to 7.5 (Wake Lock needs HTTPS).

---

## Epic 4: Recipe Input
**Goal:** Adding a recipe should be quick, from any source.

**Done** (2026-11-05): see [`.scratch/EPIC-4-recipe-input/spec.md`](../.scratch/EPIC-4-recipe-input/spec.md) and its issues (US-4.1 Photo, US-4.2 Quick Paste, US-4.3 Draft import, US-4.4 Bookmarklet). The bookmarklet targets desktop browsers first; phones are best effort.

Beyond the spec:
* A schema.org microdata fallback in the bookmarklet (issue 08), because Valdemarsro has no `ld+json` Recipe.
* An import opens the form on top of the cookbook, so Cancel and Back ask to discard and stay in the app.

Left for later:
* **Largest site photo** ([issue 09](../.scratch/EPIC-4-recipe-input/issues/09-largest-photo.md), `needs-triage`): pick it up if imported photos come out small.
* **Quick Paste fills fields differently than the owner sometimes expects** (issue 05 comments). Left as is. If it gets in the way, collect real samples with the expected result before changing the splitter's rules.

---

## Epic 5: Plan (shared meal calendar)
**Goal:** Plan meals together, with live sync and dice-roll suggestions.

**Done** (2026-11-05): see [`.scratch/EPIC-5-plan/spec.md`](../.scratch/EPIC-5-plan/spec.md) and its issues (US-5.1 week view and live sync, US-5.2 add/remove/move entries, US-5.3 "Add to plan…" from a recipe page, US-5.4 roller, US-5.5 Playwright). Called "Plan" in the interface. No meal slots, and entries can be notes ([ADR-0006](adr/0006-menu-one-document-per-date.md) amended). End-to-end tests are in: Playwright, Chromium at phone size, `npm run e2e`, run in CI.

Different from the spec:
* Removing a day's last entry leaves `entries: []` instead of deleting the document (a safe delete needs a transaction, and those fail offline). Recorded in ADR-0006.
* The roller watches the nearby Plan days live instead of reading them once.
* Writes from the Plan, "Add to plan…" and the roller aren't awaited: offline, Firestore only settles them when the device is back online.

Left for later:
* **A failed roll save only reaches the browser console**, because the roller has already gone back to the Plan. The batch is all or nothing, so the meals simply don't appear. The likely cause is a day reaching 20 entries. Add a message if it ever happens.
* Live sync between two real phones is checked in 7.5.

---

## Epic 6: Grocery List
**Goal:** Turn a range of Plan days into one combined, shared shopping list.

**Done** (2026-11-06): see [`.scratch/EPIC-6-grocery-list/spec.md`](../.scratch/EPIC-6-grocery-list/spec.md) and its issues (US-6.1 parser fixes and merge logic, US-6.2 scale on Plan entries, US-6.3 data module and rules, US-6.4 builder, US-6.5 list page). There is one saved, shared list ([ADR-0008](adr/0008-grocery-list-one-shared-document.md)), merged in the browser, and Plan entries gain a `scale` ([ADR-0006](adr/0006-menu-one-document-per-date.md) amended). A second Playwright test checks ticks and added items between two phones.

Different from the spec:
* The merged list is sorted by the name shown, not the merge key ("flour" was listed under W).
* A synonym can say which unit a name implies, so "1 garlic clove" counts as a clove. Leftover teaspoons round to the nearest ¼.
* The Plan entry's scale is a segmented control in the "⋯" menu (Mantine forces menu items to be plain `menuitem`s).
* `tick` and `untick` take a list of ids (a merged line ticks all its sources in one write). `ticked` may be missing until the first tick.
* The builder's range uses the roller's From/To date fields, not the popup calendar. "N meals are already on it" is shown before choosing Replace or Add.

Left for later:
* **Missed merges** the conservative rules leave as separate lines ("parmesan" / "shredded parmesan cheese", "Onions" / "chopped onion", the different peppers). Grow the synonym table in `src/groceries/mergeKey.ts` as they come up.
* A pantry list and shop sections, once the list has been used for a few weeks (spec, Further Notes).
* The e2e sign-in helper retries the Auth emulator's "add account" click (PR #48), after it flaked in CI on PRs #46 and #47.

---

## Epic 7: Go-live
**Goal:** Ship to real Firebase and GitHub Pages.

**Done** (2026-11-07): live at https://jompero.github.io/recipe-app/. See [`.scratch/EPIC-7-go-live/spec.md`](../.scratch/EPIC-7-go-live/spec.md) and its issues (US-7.1 deploy workflow and checklist fixes, US-7.2 Firebase project, US-7.3 Pages deploy and API key, US-7.4 moving the data, US-7.5 members and the iPhone smoke test, US-7.6 wrap-up). Project `family-recipes-64bda` in `europe-west2`; rules deployed by hand (`npm run deploy:rules`); local development stays on the emulator. Every smoke test step passed on an iPhone 15 Pro Max and an iPhone 14 (iOS 26.6.2).

Different from the spec:
* The project ID has a suffix: `family-recipes-64bda`.
* The site first redirected to a dead custom domain (`www.josejompero.com`) set on the account's user site `jompero.github.io`; a user site's domain applies to every project site in the account. Removed in GitHub. Moving to `recipes.danijompero.com` is below (Later: Custom domain).

Left for later:
* **Android is untested:** nobody in the group has one. Check sign-in, photos and Wake Lock if anyone ever uses one.

Found in the smoke test on the live site (2026-11-07), left for later. No code changes in Epic 7. Input zoom, opening on the menu and the Roll button were fixed in Epic 9:
* **Layout on iPad and desktop** needs a look; the app was designed for phones first. Picked up as Epic 10 (below).

---

## Epic 8: Custom Domain
**Goal:** Serve the app at `recipes.danijompero.com` instead of `jompero.github.io/recipe-app/`. Decided during Epic 7 (2026-11-07), kept out of it so go-live wasn't held up. Done before the PWA: an installed app belongs to its origin, so moving later would mean reinstalling on every phone.

**Done** (2026-11-07): live at https://recipes.danijompero.com/; `jompero.github.io/recipe-app/` 301-redirects there. See [`.scratch/EPIC-8-custom-domain/spec.md`](../.scratch/EPIC-8-custom-domain/spec.md) and its issues (US-8.1 relative base, US-8.2 domain verification, US-8.3 Firebase and API key, US-8.4 the switch, US-8.5 smoke test and removing the old origin, US-8.6 docs). The only smoke test failure was the screen sleeping on a recipe: Low Power Mode refuses wake locks on iOS, so it's not a bug.

Specified in `.scratch/EPIC-8-custom-domain/spec.md` (grilled 2026-11-07). In short: a relative Vite `base` (`./`) ships first, so one build works at both addresses and the switch has no downtime. Then the account verifies `danijompero.com`, Firebase and the API key allow the new address, the domain is set in this repo's Pages settings with a `CNAME` at one.com, the owner runs a smoke test, and the github.io origin is removed.

---

## Epic 9: Installable Phone App (PWA)
**Goal:** Install the app on the home screen, with a smooth offline experience in the kitchen.

**Done** (2026-11-08): installable from Safari and Chrome on iOS, with the cast-iron pot icon. Details are in [`.scratch/EPIC-9-installable-app/spec.md`](../.scratch/EPIC-9-installable-app/spec.md) and its issues:
* US-9.1: the sign-in check in a home-screen app
* US-9.2: phone polish
* US-9.3: icon, favicon and page colours
* US-9.4: manifest, service worker, update banner and ADR-0009
* US-9.5: offline strip and "Needs a connection"
* US-9.6: install note
* US-9.7: smoke test on two iPhones
* US-9.8: docs

Popup sign-in works in the installed app, so ADR-0003 stands. The service worker precaches only the app's own files (ADR-0009).

Left for later:
* **Android:** the icon is declared maskable, but nothing has been tested on Android.
* **Splash screens** (`apple-touch-startup-image`): iOS shows a blank white screen for a moment at launch instead.

---

## Epic 10: Wide Layouts (iPad Landscape and Desktop)
**Goal:** Make the app use an iPad in landscape and a computer screen well, without changing the phone layout.

Specified in [`.scratch/EPIC-10-wide-layouts/spec.md`](../.scratch/EPIC-10-wide-layouts/spec.md) (grilled 2026-11-08). In short:
* One wide layout from Mantine's `md` (about 992px) up, with a sticky top bar instead of the menu button and content capped at about 1200px. Phones keep the bottom button.
* Layouts were prototyped first on a throwaway branch (US-10.1, done 2026-11-08); the picks are in the spec.
* The build stories then cover:
  * the Data page's spacing
  * the cookbook grid (320px thumbnails kept)
  * the recipe page in two columns
  * the grocery list column
  * the roller's week grid
* Three features come last:
  * the Plan's month view (wide only)
  * drag and drop on the Plan (all sizes, long-press on phones)
  * grocery aisle sections from a static table

Left for later:
* **The recipe spread can feel cramped at 1024px** (iPad Mini landscape) when there's a photo: the photo takes 38.2%, leaving about 245px for the ingredients and 300px for the method. Options if it bothers anyone: a smaller photo share below about 1180px, the method under the ingredients at that width, or the photo-less two-column arrangement there. Found in the US-10.6 check (2026-11-08).
