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

**Specified:** see [`.scratch/EPIC-2-pepperplate-import/spec.md`](../.scratch/EPIC-2-pepperplate-import/spec.md) (stories US-2.1 to US-2.7). The image compressor moved here from 4.3.

---

## Epic 3: Recipe Browser
**Goal:** A fast, phone-friendly way to explore the shared cookbook.

**Specified:** see [`.scratch/EPIC-3-recipe-browser/spec.md`](../.scratch/EPIC-3-recipe-browser/spec.md) (stories US-3.1 to US-3.6). Built after Epic 2. The earlier plan to add Playwright tests here was dropped in the Epic 3 grilling; revisit end-to-end tests in Epic 5.

---

## Epic 4: Recipe Input
**Goal:** Adding a recipe should be quick, from any source.

* **4.1 Quick Paste:** paste rough recipe text and get a parsed draft to correct (reuses the 2.1 and 2.2 parsers).
* **4.2 Recipe bookmarklet:** a bookmarklet run on a recipe website reads its `ld+json` Recipe data and hands it to the app as a draft. No server and no CORS proxy.
* **4.3 Photo upload:** take or pick a photo for a recipe. Reuses the JPEG compressor built in Epic 2 (US-2.3).

---

## Epic 5: "Yahtzee-Style" Calendar
**Goal:** Plan meals together, with live sync and dice-roll suggestions.

* **5.1 Calendar navigation:** browse any date range, past or future. Data is one `menu_days/{YYYY-MM-DD}` document per date ([ADR-0006](adr/0006-menu-one-document-per-date.md)).
* **5.2 Manual assignment:** add a recipe to a date (merge-safe with `arrayUnion`). Supports several meals per day.
* **5.3 Recipe roller:** pick a range of dates, roll random recipes, lock the days you like, re-roll the rest, then save.
* **5.4 Live sync:** the visible range uses `onSnapshot`, so changes on one device appear on the others.
* **Open question:** decide whether to add end-to-end browser tests (e.g. Playwright with a phone-sized WebKit project), since live sync across devices is the riskiest flow so far. Deferred from Epic 3.

---

## Epic 6: Grocery List
**Goal:** Turn a range of menu dates into one combined shopping list.

* **6.1 Date range selection:** choose the range of dates the list is built from.
* **6.2 Unit conversion:** convert between units (volume, mass) using the parsed ingredient fields, metric by default.
* **6.3 Ingredient merging:** combine ingredients across recipes (e.g. `1 cup milk` + `250 ml milk`) into a checklist with checkboxes. Lines that couldn't be parsed are listed separately, never dropped.

---

## Epic 7: Go-live
**Goal:** Ship to real Firebase and GitHub Pages. Follow the checklist in `docs/project/project-setup.md`, Phase 2.

* **7.1 Firebase project:** Spark plan, Firestore in `europe-west2`, Google sign-in, authorized domain, API key restricted to the site's domains.
* **7.2 Rules and members:** deploy the rules with the CLI. Add `allowed_users` documents in the console.
* **7.3 Pages deploy:** official Pages actions workflow, Firebase config as Actions variables.
* **7.4 Data migration:** export from local, restore on live (or run the importer again).
* **7.5 Phone smoke test:** sign-in popup, photo upload and live sync on iOS and Android.

---

## Epic 8: Installable Phone App (PWA)
**Goal:** Install the app on the home screen, with a smooth offline experience in the kitchen.

* **8.1 Manifest and service worker:** e.g. `vite-plugin-pwa`, icons, add to home screen.
* **8.2 Offline experience:** builds on the Firestore offline copy that's on from Epic 1. Offline state shown in the interface.
