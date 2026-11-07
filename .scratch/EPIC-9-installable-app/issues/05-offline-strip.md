# 05: Offline strip and network-only features

Status: ready-for-agent
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

- [ ] Unit tests with fake timers: the Firestore signal must hold before the strip shows; the phone's offline shows at once; back online hides it.
- [ ] Component tests: the strip shows with the signal faked; each network-only feature is disabled with its note when the phone says offline, and enabled otherwise.
- [ ] Playwright test: load the app, `setOffline(true)`, the strip appears and a recipe still opens; `setOffline(false)`, the strip goes away.
- [ ] `npm run check` and `npm run e2e` pass.

## Comments
