# EPIC-7: Go-live

Status: ready

Replaces the Epic 7 placeholder in `docs/backlog.md`. Settled in a grilling session on 2026-11-06. The go-live checklist is Phase 2 of `docs/project/project-setup.md`; issue 01 corrects it against current docs before anyone follows it. Related decisions: [ADR-0003](../../docs/adr/0003-google-sign-in-popup.md) (popup sign-in), [ADR-0004](../../docs/adr/0004-official-pages-actions-hashrouter.md) (official Pages actions), [ADR-0007](../../docs/adr/0007-local-first-until-go-live.md) (local-first until now).

## Problem Statement

Everything through the grocery list runs only on the owner's PC against the Firebase Emulator. Members can't use the app from their own phones, and the real data lives in a local emulator export that one bad shutdown can wipe.

## Solution

Create the real Firebase project, deploy the site to GitHub Pages at `https://jompero.github.io/recipe-app/`, move the owner's emulator data to it, add the members, and check the app on two real iPhones. Local development stays on the emulator.

## Build order

| Issue | Story | Who | Blocked by |
|---|---|---|---|
| 01 Deploy workflow, guard, rules script, checklist fixes | US-7.1 | agent | none |
| 02 Firebase project, sign-in and rules | US-7.2 | owner | 01 (for the corrected checklist and `deploy:rules`) |
| 03 Pages deploy and API key restriction | US-7.3 | owner | 01, 02 |
| 04 Move the data | US-7.4 | owner | 03 |
| 05 Members and the iPhone smoke test | US-7.5 | owner + a member | 04 |
| 06 Wrap-up docs | US-7.6 | agent | 05 |

Strictly in order. The owner's issues (02–05) are checklists; each ends with a "check it worked" step. Anything the smoke test finds becomes a new numbered fix issue in this folder, `ready-for-agent`, and 06 waits for it.

Once 01 is merged, each push to `main` runs the deploy workflow, and its guard fails on purpose until 03 sets the Actions variables. Those red runs are expected.

## User Stories

1. As a member, I want to open the app on my own phone from a web address, so that I can use it without the owner's PC.
2. As a member, I want to sign in with my Google account, so that I don't manage another password.
3. As the owner, I want only the people I add to see or change anything, so that the cookbook stays private even though the site is public.
4. As the owner, I want my recipes, photos and Plan from the emulator on the live site, so that nothing I've entered is lost.
5. As the owner, I want every merge to `main` to deploy itself, so that a fix reaches the phones without manual steps.
6. As the owner, I want a broken or missing config to stop the deploy, so that the live site never goes out pointing at nothing or at the emulator.
7. As the owner, I want local development and tests to keep using the emulator, so that I can't break the live data while building.
8. As the owner, I want a simple way to back up the live data, so that a mistake can be undone.

## Implementation Decisions

### The Firebase project

- Project ID `family-recipes`. If it's taken, Firebase suggests one with a suffix; take that and use it everywhere `family-recipes` appears below.
- Spark plan. Nothing in the app or the setup may need Blaze.
- Firestore: **Standard** edition, **Production mode** (denies everything until our rules are deployed), location **`europe-west2` (London)**: from Iceland the cables run to the UK, Ireland and Denmark. The location can't be changed later.
- Authentication: Google provider on. Authorized domains: add `jompero.github.io`. **No localhost**: projects created after 28 Apr 2025 don't include it, and local dev never talks to the live project.
- Web app registered; its config (`apiKey`, `authDomain`, `projectId`, `appId`) goes into GitHub Actions **variables**, not secrets (it ships in the bundle).

### The API key

- The "Browser key (auto created by Firebase)" in Google Cloud Console → APIs & Services → Credentials.
- **Application restriction**, HTTP referrers: `https://jompero.github.io/*` and `https://family-recipes.firebaseapp.com/*`. The second is needed because the sign-in popup's handler page lives on the `authDomain` and calls the API with the key. This comes from community reports, not an official doc, hence the test right after.
- **API restriction**: check it allows Identity Toolkit, Token Service, Cloud Firestore, Cloud Datastore, Firebase Management and Logging (the APIs Firebase lists for Auth, Firestore and all products). Don't remove any of them, and never add the Generative Language (Gemini) API.
- Restricted **after** the first live sign-in works (03), then sign-in is tested again, so a bad restriction is easy to tell apart from other problems.

### Rules

- Deployed **by hand** from the owner's PC: `npm run deploy:rules` runs `firebase deploy --only firestore:rules --project prod`. No Google credential is stored in GitHub.
- `.firebaserc` gets a `prod` alias for the real project ID; `default` stays `demo-recipe-app`, so the emulator, tests and e2e don't change. The alias is committed once the real ID is known (02).
- A new PR template has a checkbox: "Changed `firestore.rules`? Run `npm run deploy:rules` after merging."

### Deploy workflow (`.github/workflows/deploy.yml`)

- Triggers: push to `main` and `workflow_dispatch`. It doesn't run CI again; `main` is protected and the `check` job already passed.
- Shaped like Vite's GitHub Pages example, with current versions (checked 2026-11-06): `actions/checkout@v7`, `actions/setup-node@v7` (`node-version-file: .nvmrc`, npm cache, as in `ci.yml`), `actions/configure-pages@v6`, `actions/upload-pages-artifact@v5` (path `dist`), `actions/deploy-pages@v5`. Permissions `contents: read`, `pages: write`, `id-token: write`; environment `github-pages`; concurrency group `pages`, not cancelling a deploy in progress. Check each version again when building.
- `npm run build` gets `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` and `VITE_FIREBASE_APP_ID` from `vars.FIREBASE_*`, and `VITE_USE_EMULATOR: "false"`.
- **Guard** step before the build: fail with a clear message if any of the four values is empty, the project ID starts with `demo-`, or `VITE_USE_EMULATOR` is `true`. A few lines of shell in the workflow; no app code changes.

### Moving the data

- Source: the owner's current emulator, not the Nov 3 base export. The owner first deletes test recipes and test Plan entries in the emulator, then runs Export everything on the Data page, then on the live site (signed in as a member) runs Restore with that file.
- The grocery list isn't in the export; a new one is built on the live site.
- Size: ~32 MB and a few hundred writes, well within Spark's 20,000 writes a day and 1 GiB. Firestore's old 500-writes-per-batch limit no longer exists (the limit is now 10 MiB per request); `src/data/batches.ts` already caps batches at 100 writes and ~8 MB, so nothing changes.
- Keep the export file afterwards: it's the first backup.

### Backups

- Spark has no scheduled backups, point-in-time recovery or managed export (all Blaze only). The Data page's Export is the only backup. The README documents the habit: export now and then, and keep the file outside the repo.

### Smoke test

- On the live site, with **two iPhones** (nobody in the group has Android), after the members are added:
  - sign in with the popup on both;
  - browse the cookbook and open a recipe; the screen stays awake with it open;
  - add a recipe with a photo taken on the phone;
  - edit the Plan on one phone and see it appear on the other; tick a grocery line on one and see it on the other;
  - a Google account not in `allowed_users` sees the "not a member" screen and no data.
- It passes only when every item works on both phones.

## Testing Decisions

- No new automated tests: the app code doesn't change. CI keeps running against the emulator.
- The deploy guard is checked once by hand: the first deploy run after 01 merges must fail at the guard with its message (no variables yet).
- Everything live is checked by the owner, with the "check it worked" step at the end of each of 02–05.

## Out of Scope

- A staging project, a custom domain, App Check (free on Spark, but the allowlist rules already keep strangers out; it would only add quota-abuse protection), error reporting or analytics.
- Running the local dev server against the live project.
- Deploying rules from CI.
- Android: nobody has one. Left for later, untested.
- Moving the grocery list.
- Anything from Epic 8 (PWA, offline interface).

## Further Notes

- After 06, `CLAUDE.md`'s "Local-first" rule changes: the live project exists, but local development and tests still use only the emulator.
- If the project ID has a suffix, update this spec's issues as they're worked, not all up front.
