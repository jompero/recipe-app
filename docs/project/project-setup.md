# Project Setup

How the app is wired together, in two phases matching the backlog:
- **Local foundation (Epic 1):** everything runs on your machine against the Firebase Emulator. No Firebase account and no secrets are needed.
- **Go-live (Epic 7):** create the real Firebase project and deploy to GitHub Pages.

Corrected from the original Gemini draft. See the end for what was wrong.

> **Version numbers:** Action and library versions below were current when this was written. Check the latest major version of each when you actually set it up. Out-of-date versions are a common AI hallucination.

---

## Phase 1: Local foundation

### Prerequisites
- Node.js 22 LTS or newer
- A Java JDK 21 (the Firebase Emulator needs it), for example Eclipse Temurin
- `npm install -D firebase-tools` (use it through `npx firebase …`)

### `.env` (local)

Copy `.env.example` to `.env`. For local work the values are dummies: a project ID starting with `demo-` tells Firebase tools it's offline-only.

```ini
VITE_USE_EMULATOR=true
VITE_FIREBASE_API_KEY=demo-key
VITE_FIREBASE_AUTH_DOMAIN=demo-recipe-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-recipe-app
VITE_FIREBASE_APP_ID=demo-app
```

### `src/config/firebase.ts`

```ts
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
} from "firebase/firestore";

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

export const auth = getAuth(app);

// Offline copy on the device, shared across browser tabs
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

if (import.meta.env.VITE_USE_EMULATOR === "true") {
  // Use the page's own hostname so a phone on the same Wi-Fi reaches the emulator too
  const host = window.location.hostname;
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
}
```

No `getStorage`: the app doesn't use Firebase Storage ([ADR-0001](../adr/0001-images-in-firestore-not-storage.md)). Only `src/data/*` imports from this file.

### `firebase.json` (emulators + rules)

```json
{
  "firestore": { "rules": "firestore.rules" },
  "emulators": {
    "auth": { "port": 9099, "host": "0.0.0.0" },
    "firestore": { "port": 8080, "host": "0.0.0.0" },
    "ui": { "enabled": true }
  }
}
```

Run the emulator with data that survives restarts:

```sh
npx firebase emulators:start --project demo-recipe-app --import=.emulator-data --export-on-exit
```

Add `.emulator-data/` to `.gitignore`. To test on a phone, run `vite --host` and open `http://<pc-ip>:5173/<base>/` on the same Wi-Fi.

### `vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/recipe-app/", // must equal the GitHub repo name, or every asset 404s on Pages
});
```

### `firestore.rules`

Lives in the repo and is deployed with the CLI. No emails are in it ([ADR-0002](../adr/0002-allowlist-collection.md)).

> The repo's [`firestore.rules`](../../firestore.rules) is the source of truth. The copy below is the Epic 1 membership core. Since Epic 2 (US-2.4) the real file also checks the shape of `recipes` and `recipe_images` documents and denies deleting them.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isMember() {
      return request.auth != null
        && request.auth.token.email_verified == true
        && exists(/databases/$(database)/documents/allowed_users/$(request.auth.token.email));
    }

    // Each collection gets an explicit rule. Do NOT add a {document=**} catch-all:
    // rules are OR-ed, so it would let members edit allowed_users.
    match /recipes/{id}        { allow read, write: if isMember(); }
    match /recipe_images/{id}  { allow read, write: if isMember(); }
    match /menu_days/{date}    { allow read, write: if isMember(); }

    // Users may check their own membership. Only the console can write here.
    match /allowed_users/{email} {
      allow read: if request.auth != null && request.auth.token.email == email;
      allow write: if false;
    }
  }
}
```

The rules are tested with `@firebase/rules-unit-testing` and Vitest, run by `firebase emulators:exec "npm run test:rules"`. At minimum the tests check that:
- a signed-out user is denied
- a signed-in user who isn't on the allowlist is denied
- a user with an unverified email is denied
- a member can read and write
- a member can't write to `allowed_users`

### CI on pull requests: `.github/workflows/ci.yml`

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: 21 }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npx firebase emulators:exec --project demo-recipe-app --only auth,firestore "npm test"
      - run: npm run build
        env:
          VITE_FIREBASE_PROJECT_ID: demo-recipe-app
```

No secrets are needed. ESLint and Prettier also run before each commit through Husky and lint-staged.

---

## Phase 2: Go-live

Do these in order. Each item is a known way for the first deploy to fail. Checked against the Firebase, Google Cloud and GitHub docs on 2026-11-06; console labels move, so trust what you see over the exact wording here. The step-by-step versions with checks are the Epic 7 issues in `.scratch/EPIC-7-go-live/issues/` (02–05).

1. **Create the Firebase project** on the Spark plan (Analytics off). Note the project ID it gives: if the name is taken it adds a suffix, and the ID can't be changed later.
2. **Create the Firestore database:** **Standard** edition, location **`europe-west2` (London)**, **Production mode** (it denies everything until our rules are deployed). The location can't be changed later.
3. **Enable Google sign-in** (Authentication → Sign-in method → Google).
4. **Add the authorized domain** `recipes.danijompero.com` (Authentication → Settings → Authorized domains; the domain only, no path). If you skip this, sign-in fails on the live site. Don't add `localhost`: projects created after 28 Apr 2025 don't include it, and local development only uses the emulator.
5. **Register a web app** (Project settings → Your apps → Web; no Hosting) and copy `apiKey`, `authDomain`, `projectId` and `appId`.
6. **Add the `prod` alias** for the real project ID to `.firebaserc`. `default` stays `demo-recipe-app`, so the emulator, tests and e2e don't change.
7. **Deploy the rules:** `npx firebase login` once, then `npm run deploy:rules` (`firebase deploy --only firestore:rules --project prod`). Rules are only ever deployed by hand like this; after a PR that changes `firestore.rules`, run it again (the PR template reminds you).
8. **Add yourself as a member:** in the Firestore console, collection `allowed_users`, a document whose ID is your **Gmail address in lowercase**. The rules only check that it exists.
9. **GitHub repo settings:**
   - Pages → Build and deployment → Source: **GitHub Actions**.
   - Secrets and variables → Actions → **Variables**: `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`. These are Variables, not Secrets: the values are public in the bundle anyway.
   - **Custom domain** (EPIC-8; step-by-step with checks in `.scratch/EPIC-8-custom-domain/issues/02` and `04`): verify `danijompero.com` for the account (your Settings → Pages → Add a domain, then a TXT record `_github-pages-challenge-jompero` at one.com, kept forever). In the repo's Pages settings, set the custom domain `recipes.danijompero.com` **before** adding a `CNAME` record `recipes` → `jompero.github.io` at one.com. No `CNAME` file: an Actions deploy ignores it. Once the certificate is issued (up to 24 hours; Remove and re-add the domain if it's stuck), tick **Enforce HTTPS**.
10. **Deploy:** Actions → "Deploy to GitHub Pages" → Run workflow (or push to `main`). The workflow is [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml). Its first step fails the run if a variable is empty, the project ID starts with `demo-`, or `VITE_USE_EMULATOR` is `true`. Then open `https://recipes.danijompero.com/` and sign in.
11. **Restrict the API key**, only after that first sign-in works (Google Cloud console → APIs & Services → Credentials → "Browser key (auto created by Firebase)"):
    - Application restrictions → Websites (HTTP referrers): `https://recipes.danijompero.com/*` and `https://<project-id>.firebaseapp.com/*`. The second is needed because the sign-in popup's handler page lives on the `authDomain` and uses the key (from community reports; no official doc covers referrers).
    - API restrictions: keep the list Firebase set, and check it includes Identity Toolkit, Token Service, Cloud Firestore, Cloud Datastore, Firebase Management and Logging. Don't remove any of them. Never add the Generative Language (Gemini) API to this public key.
    - Wait a few minutes, then sign out and in again on the live site. If it fails with a blocked-referrer error, add the referrer it names.
12. **Move the data:** in the local app, delete test data, then Data page → Export everything. Sign in on the live site and Restore that file. Keep the file: Spark has no scheduled backups, point-in-time recovery or managed export (all Blaze only), so the Data page's Export is the only backup.
13. **Add the members** (as in step 8) and **smoke test on two iPhones:** sign in (popup), browse, the screen stays awake on a recipe, add a recipe with a photo, edit the Plan on one phone and watch it appear on the other, tick a grocery line on one and see it on the other, and a non-member sees nothing.

---

## What the original Gemini draft got wrong

| Draft said | Reality |
|---|---|
| Firebase Storage is free | Needs Blaze since 3 Feb 2026, so images moved to Firestore |
| `service api.storage` | Would have been `service firebase.storage`. Moot now. |
| `your_project_://firebaseapp.com` | `your-project-id.firebaseapp.com` (garbled placeholder) |
| `.env` keeps keys safe from exposure | The config ships in the public bundle. The rules are the protection. |
| Emails hardcoded in rules, no `email_verified` check | `allowed_users` collection plus an `email_verified` check |
| `{document=**}` catch-all rule | An explicit rule for each collection |
| Turn off registration in the console | Not needed with Google sign-in plus allowlist rules |
| `JamesIves/…` deploy to `gh-pages` with `contents: write` on Node 20 | Official Pages actions with narrow permissions, on the Node version in `.nvmrc` (Node 20 reached end of life in Apr 2026) |
| No Vite `base`, no authorized domain, no SPA routing | All three are needed, or the site or sign-in breaks |
| WebP images | Safari can't produce WebP from a canvas, so JPEG |
