# 05: Offline strip and network-only features

Status: done
Story: US-9.5
Branch: `EPIC-9/US-9.5-offline`
Spec: [../spec.md](../spec.md) (Offline strip and network-only features)
Blocked by: none

## What to build

- **Sync signal from `src/data`** (still the only code importing Firebase):
  - The always-on recipes listener also listens for metadata changes (`includeMetadataChanges`) and reports whether its snapshot is `fromCache`. Check the current Firestore docs for the API.
  - Don't make the cookbook re-render or re-sort on metadata-only changes.
- **Offline status** combining two signals:
  - The phone's `offline`/`online` events and `navigator.onLine`: offline counts at once.
  - Firestore's `fromCache`: counts only after it has held for a few seconds, because every cold start is briefly `fromCache`. Pick the delay and say why under Comments.
  - Back online, or Firestore reaching the server, hides it.
  - Expose two values: "show the strip" and "the phone says it's offline".
- **Offline strip:** a slim strip under the menu button on every member page, "Offline: changes will sync when you're back online", in the Book look (label voice, quiet colours). It doesn't push content around in a jarring way.
- **Network-only features**, disabled with a short "Needs a connection" note **only when the phone says it's offline**:
  - the sign-in button
  - the website-photo fetch on `#/import` (paste or drop by hand stays)
  - the Data page's Pepperplate import and Restore

  Export stays enabled.
- **Photos offline:** if a recipe's full-size photo can't be loaded (not in the offline copy), the recipe page shows the thumbnail instead of an empty space or spinner. Check what happens today first; it may already do this.
- GLOSSARY: add **Offline strip**.

## Acceptance criteria

- [x] Unit tests with fake timers: the Firestore signal must hold before the strip shows; the phone's offline shows at once; back online hides it.
- [x] Component tests: the strip shows with the signal faked; each network-only feature is disabled with its note when the phone says offline, and enabled otherwise.
- [x] Playwright test: load the app, `setOffline(true)`, the strip appears and a recipe still opens; `setOffline(false)`, the strip goes away.
- [x] `npm run check` and `npm run e2e` pass.

## Comments

**2026-11-07 (agent):** Merged in PR #64.
- **The Firestore signal** comes from a separate metadata-only listener on the recipes query (`src/data/connection.ts`, `includeMetadataChanges`). The SDK shares the server listen with `watchRecipes`, so the cookbook isn't touched on metadata changes and there are no extra reads. (The spec suggested the recipes listener itself.)
- **Hold:** `FROM_CACHE_HOLD_MS` is 5 s, long enough for a slow cold start to reach the server, short enough to show a real outage soon.
- **The strip** is fixed along the bottom edge, under the menu button. A `--offline-strip` CSS variable lifts the menu button and the edit form's Save bar while it shows.
- **"Needs a connection"** shows on sign-in, the Pepperplate import, both Restore buttons, and the site photo fallback on `#/import` (the fetch there is automatic, so only its message changes). Export stays enabled.
- The recipe page already showed the thumbnail first. Its full-photo load now catches the offline error, so the thumbnail stays.
- **Tests:** the connection module is faked for every app test in `vitest.setup.ts` (`src/test-utils/fakeConnection.ts`). Before that, page tests loaded Firebase and passed only because a local `.env` existed.
- **CI:** green, including the new `e2e/offline.spec.ts`. It couldn't run locally because the owner's `dev:all` emulators held the ports.
