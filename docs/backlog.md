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

**Specified** (2026-11-05): see [`.scratch/EPIC-5-plan/spec.md`](../.scratch/EPIC-5-plan/spec.md) and its issues (US-5.1 week view and live sync, US-5.2 add/remove/move entries, US-5.3 "Add to plan…" from a recipe page, US-5.4 roller, US-5.5 Playwright). Called "Plan" in the interface. No meal slots, and entries can be notes ([ADR-0006](adr/0006-menu-one-document-per-date.md) amended). The end-to-end question is settled: a minimal Playwright setup (Chromium, phone size) with a two-window live sync test.

---

## Epic 6: Grocery List
**Goal:** Turn a range of menu dates into one combined shopping list.

* **6.1 Date range selection:** choose the range of dates the list is built from.
* **6.2 Unit conversion:** convert between units (volume, mass) using the parsed ingredient fields, metric by default. Review the unit spellings in `src/parsing/ingredientLine.ts` first: e.g. "tlk" (seen in the owner's US-3.5 test) isn't recognised yet.
* **6.3 Ingredient merging:** combine ingredients across recipes (e.g. `1 cup milk` + `250 ml milk`) into a checklist with checkboxes. Lines that couldn't be parsed are listed separately, never dropped.

---

## Epic 7: Go-live
**Goal:** Ship to real Firebase and GitHub Pages. Follow the checklist in `docs/project/project-setup.md`, Phase 2.

* **7.1 Firebase project:** Spark plan, Firestore in `europe-west2`, Google sign-in, authorized domain, API key restricted to the site's domains.
* **7.2 Rules and members:** deploy the rules with the CLI. Add `allowed_users` documents in the console.
* **7.3 Pages deploy:** official Pages actions workflow, Firebase config as Actions variables.
* **7.4 Data migration:** export from local, restore on live (or run the importer again).
* **7.5 Phone smoke test:** sign-in popup, photo upload and live sync on iOS and Android. Also: the screen stays awake with a recipe open (Screen Wake Lock needs HTTPS, so it can't be checked over the LAN dev server; moved here from US-3.4).

---

## Epic 8: Installable Phone App (PWA)
**Goal:** Install the app on the home screen, with a smooth offline experience in the kitchen.

* **8.1 Manifest and service worker:** e.g. `vite-plugin-pwa`, icons, add to home screen.
* **8.2 Offline experience:** builds on the Firestore offline copy that's on from Epic 1. Offline state shown in the interface.
