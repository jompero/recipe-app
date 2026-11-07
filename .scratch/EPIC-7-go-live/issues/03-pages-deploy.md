# 03: Pages deploy and API key restriction

Status: done
Story: US-7.3
Spec: [../spec.md](../spec.md) (Deploy workflow, The API key)
Blocked by: 01, 02

The owner does this in GitHub's repo settings and the Google Cloud console.

## Steps

- [x] GitHub → repo Settings → Pages → Build and deployment → Source: **GitHub Actions**.
- [x] Settings → Secrets and variables → Actions → **Variables** tab (not Secrets) → add `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID` with the values from 02.
- [x] Actions → "Deploy to GitHub Pages" → Run workflow on `main`. Wait for both jobs to go green.
- [x] Open `https://jompero.github.io/recipe-app/` on your PC. Sign in with Google (popup). You should land in an empty cookbook, as a member.
- [x] Google Cloud console (same project) → APIs & Services → Credentials → "Browser key (auto created by Firebase)":
  - Application restrictions → **Websites** (HTTP referrers): `https://jompero.github.io/*` and `https://<project-id>.firebaseapp.com/*`.
  - API restrictions: leave the list Firebase set. Check it includes Identity Toolkit, Token Service, Cloud Firestore, Cloud Datastore, Firebase Management and Logging. Don't remove any; never add Generative Language (Gemini).
  - Save. Changes can take a few minutes.
- [x] After ~5 minutes: sign out on the live site, close the tab, open it again and sign in.

## Check it worked

- [x] The deploy run is green and the site loads with styles and fonts (no 404s for assets in the browser's Network tab).
- [x] Sign-in works **after** the key restriction. If it fails with a 403 or `API key not valid` / `requests-from-referer-...-are-blocked`, note the exact message and the blocked referrer here, add that referrer, and try again.
- [x] Refreshing on a deep link (e.g. `#/plan`) still loads the page.

## Comments

**2026-11-07:** Done by the owner, including the key restriction and signing in again. On the first try the site redirected to the dead custom domain `www.josejompero.com`, set on the account's user site `jompero/jompero.github.io` (a user site's domain applies to every project site in the account). The owner removed it. Moving to `recipes.danijompero.com` is in the backlog (Later: Custom domain). First green deploy: https://github.com/jompero/recipe-app/actions/runs/42316614756. The agent checked: the page and its JS and CSS assets return 200, and the bundle holds `family-recipes-64bda` and no `demo-recipe-app`. In the Google Cloud console the Logging API is called "Cloud Logging API".
