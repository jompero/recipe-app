# EPIC-8: Custom Domain

Status: ready

Replaces "Later: Custom domain" in `docs/backlog.md`. Settled in a grilling session on 2026-11-07. The PWA, which was Epic 8, is now Epic 9. Related decisions: [ADR-0003](../../docs/adr/0003-google-sign-in-popup.md) (popup sign-in), [ADR-0004](../../docs/adr/0004-official-pages-actions-hashrouter.md) (official Pages actions, hash routing; amended by this epic).

## Problem Statement

The app lives at `https://jompero.github.io/recipe-app/`, an address tied to the GitHub account and repo name. The owner wants it at `recipes.danijompero.com`. The move has to happen before Epic 9 (PWA): an installed app belongs to its origin, so moving later would mean reinstalling it on every phone.

## Solution

Serve the app at `https://recipes.danijompero.com/`, set as the custom domain on this repo's Pages settings, with a DNS `CNAME` at one.com. Ship a build with a relative `base` first, so the same build works at both addresses and the switch has no downtime. After the switch, GitHub 301-redirects the old address to the new one.

## Build order

| Issue | Story | Who | Blocked by |
|---|---|---|---|
| 01 Relative base, dev at `/`, ADR-0004 amendment | US-8.1 | agent | none |
| 02 Verify `danijompero.com` for the account | US-8.2 | owner | none |
| 03 Firebase authorized domain and API key referrer | US-8.3 | owner | none |
| 04 Custom domain, DNS and HTTPS | US-8.4 | owner | 01 (deployed), 02, 03 |
| 05 Smoke test and remove the old origin | US-8.5 | owner | 04 |
| 06 Docs sweep and recovery note | US-8.6 | agent | 05 |

01, 02 and 03 can happen in any order. 04 is the switch and needs all three. Anything the smoke test finds becomes a new numbered fix issue in this folder, `ready-for-agent`, and 06 waits for it.

## User Stories

1. As a member, I want the app at a short address I can remember, so that I can open it without hunting for a bookmark.
2. As a member, I want my old links and bookmarklet to keep working, so that the move doesn't break anything for me.
3. As a member, I want the switch to happen without the app going down, so that I'm not caught mid-recipe.
4. As the owner, I want the domain protected from takeover, so that nobody else can publish a site at my addresses.
5. As the owner, I want a written way back if the domain ever dies, so that the app can return to github.io quickly.
6. As the owner, I want local development to keep matching the live site, so that end-to-end tests still catch path problems.

## Implementation Decisions

### The address

- `recipes.danijompero.com`. DNS for `danijompero.com` is at one.com. `www.danijompero.com` is the custom domain of `jompero/jompero-blog` and stays as it is.
- DNS: a `CNAME` record from `recipes` to `jompero.github.io` (no repo name; never the `*.pages.github.io` host). No other records on `recipes`, since they can block the certificate.
- GitHub says to set the domain in Settings → Pages **before** adding the DNS record.
- No `CNAME` file in the repo: with an Actions deploy, GitHub ignores it and doesn't need it.

### The base path

- Vite `base` becomes `"./"` (relative). Hash routing means only `index.html` is ever served, so relative asset URLs work at `jompero.github.io/recipe-app/` and at `recipes.danijompero.com/` alike. This is what makes a zero-downtime switch possible: the code ships first (01), and the domain is switched later (04).
- Dev and e2e run at `/`: `http://localhost:5173/`. Playwright's `BASE_URL`, the README and the bookmarklet's doc comment follow.
- The Data page builds the bookmarklet from `location.origin + location.pathname`, so it picks up the new address with no code change.
- ADR-0004 gets a dated amendment: base is relative, no longer the repo name. Hash routing and the official Pages actions stand.
- Epic 9 (PWA) must check the manifest's `scope` and `start_url` with the relative base.

### Domain verification

- `danijompero.com` is verified for the GitHub account (user Settings → Pages) with a TXT record `_github-pages-challenge-jompero` at one.com, **kept permanently**. It covers immediate subdomains (`recipes`, `www`) and stops other GitHub users from claiming them. No wildcard DNS records.

### HTTPS

- GitHub issues a Let's Encrypt certificate after the domain is set and DNS resolves. The docs say it takes anywhere from an hour to 24 hours. A check mark appears once the certificate is ready; tick **Enforce HTTPS** then.
- If it's stuck: Remove the domain in Pages settings, type it again and Save. That restarts provisioning.
- If `danijompero.com` has CAA records, one must allow `letsencrypt.org`.

### The old address

- Once the domain is set, `https://jompero.github.io/recipe-app/...` returns a **301** to the new domain, dropping `/recipe-app` and keeping the path and query. The browser keeps the `#hash`, so routes and the bookmarklet's `#/import?d=` survive. Checked on 2026-11-07 against the blog's redirect.
- Firebase authorized domains and the API key referrers keep `jompero.github.io` **during the switch**, so removing the domain is a clean rollback. They are removed after the smoke test passes (05). The `family-recipes-64bda.firebaseapp.com/*` referrer stays: the sign-in popup's handler page needs it.

### Firebase and the API key

- Authorized domains: add `recipes.danijompero.com`. `authDomain` stays `family-recipes-64bda.firebaseapp.com`, so nothing else in the sign-in setup changes. Firebase's third-party-storage guidance applies to `signInWithRedirect` only; the app uses the popup (ADR-0003).
- API key referrers: add `https://recipes.danijompero.com/*`.
- Both are added **before** the switch (03 before 04), so sign-in works the moment the redirect starts.

### Per-origin state

- Members sign in once more at the new address.
- Firestore's offline copy (IndexedDB) starts empty at the new address and rebuilds from the server. No data is lost.
- Bookmarklets: reinstalling is **optional**. Old ones point at github.io and keep working through the redirect. The owner reinstalls theirs in the smoke test to prove the new one works. In a rollback, it's the new bookmarklets that break, not the old ones.
- Members get a short heads-up from the owner: the app moved, and they sign in once more.

### If the domain lapses

- Auto-renew is already on at one.com. No other guard.
- The docs get a recovery note (06): remove the custom domain in Settings → Pages (github.io then serves the app again, since the base is relative), and add `jompero.github.io` back to Firebase authorized domains and the API key referrers. Browsers may have cached the 301, so members may need to clear the site's data or open the github.io address in a private tab.

## Testing Decisions

- 01: `npm run check` and `npm run e2e` pass with the app at `/`. Then build with the relative base and check that `dist/index.html` uses relative asset paths (`./assets/...`) and that the deployed site still works at `jompero.github.io/recipe-app/` after merging.
- No new automated tests for the switch itself. Everything live is checked by the owner, with a "check it worked" step at the end of each of 02–05.
- Smoke test: the **owner only**, on their iPhone and desktop (see 05).

## Out of Scope

- Any other subdomain or the apex `danijompero.com`.
- Changes to `jompero-blog` or `www`.
- A custom `authDomain` (Firebase Hosting would be needed to serve the auth handler there).
- Epic 9 (PWA) work, except the note about `scope`/`start_url`.
- Making members reinstall bookmarklets.
- Android.
