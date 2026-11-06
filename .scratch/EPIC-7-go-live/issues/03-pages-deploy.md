# 03: Pages deploy and API key restriction

Status: ready-for-human
Story: US-7.3
Spec: [../spec.md](../spec.md) (Deploy workflow, The API key)
Blocked by: 01, 02

The owner does this in GitHub's repo settings and the Google Cloud console.

## Steps

- [ ] GitHub → repo Settings → Pages → Build and deployment → Source: **GitHub Actions**.
- [ ] Settings → Secrets and variables → Actions → **Variables** tab (not Secrets) → add `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID` with the values from 02.
- [ ] Actions → "Deploy to GitHub Pages" → Run workflow on `main`. Wait for both jobs to go green.
- [ ] Open `https://jompero.github.io/recipe-app/` on your PC. Sign in with Google (popup). You should land in an empty cookbook, as a member.
- [ ] Google Cloud console (same project) → APIs & Services → Credentials → "Browser key (auto created by Firebase)":
  - Application restrictions → **Websites** (HTTP referrers): `https://jompero.github.io/*` and `https://<project-id>.firebaseapp.com/*`.
  - API restrictions: leave the list Firebase set. Check it includes Identity Toolkit, Token Service, Cloud Firestore, Cloud Datastore, Firebase Management and Logging. Don't remove any; never add Generative Language (Gemini).
  - Save. Changes can take a few minutes.
- [ ] After ~5 minutes: sign out on the live site, close the tab, open it again and sign in.

## Check it worked

- [ ] The deploy run is green and the site loads with styles and fonts (no 404s for assets in the browser's Network tab).
- [ ] Sign-in works **after** the key restriction. If it fails with a 403 or `API key not valid` / `requests-from-referer-...-are-blocked`, note the exact message and the blocked referrer here, add that referrer, and try again.
- [ ] Refreshing on a deep link (e.g. `#/plan`) still loads the page.

## Comments
