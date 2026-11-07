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

**Specified** (2026-11-06): see [`.scratch/EPIC-7-go-live/spec.md`](../.scratch/EPIC-7-go-live/spec.md) and its issues (US-7.1 deploy workflow and checklist fixes, US-7.2 Firebase project, US-7.3 Pages deploy and API key, US-7.4 moving the data, US-7.5 members and the iPhone smoke test, US-7.6 wrap-up). Project `family-recipes` in `europe-west2`; rules deployed by hand; local development stays on the emulator. Only iPhones are tested (nobody in the group has Android).

---

## Epic 8: Installable Phone App (PWA)
**Goal:** Install the app on the home screen, with a smooth offline experience in the kitchen.

* **8.1 Manifest and service worker:** e.g. `vite-plugin-pwa`, icons, add to home screen.
* **8.2 Offline experience:** builds on the Firestore offline copy that's on from Epic 1. Offline state shown in the interface.

---

## Later: Custom domain
**Goal:** Serve the app at `recipes.danijompero.com` instead of `jompero.github.io/recipe-app/`. Decided during Epic 7 (2026-11-07), kept out of it so go-live wasn't held up.

* DNS at one.com: `CNAME recipes → jompero.github.io`.
* GitHub: verify `danijompero.com` for the account (Settings → Pages), set the custom domain on this repo, enforce HTTPS once the certificate is issued. No `CNAME` file is needed with the Actions deploy.
* Vite `base` `/recipe-app/` → `/`; amend ADR-0004 (base equals the repo name).
* Firebase: add the authorized domain. API key: referrer `https://recipes.danijompero.com/*` in place of `https://jompero.github.io/*` (keep the `firebaseapp.com` one).
* Do it before Epic 8: an installed PWA belongs to its origin, so moving later means reinstalling on every phone, and the offline copy (IndexedDB) is per origin too, so it starts empty at the new address.
