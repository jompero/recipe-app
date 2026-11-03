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

Do these in order. Each item is a known way for the first deploy to fail.

1. **Create the Firebase project** on the Spark plan. Create the Firestore database in **`europe-west2` (London)**. The region can't be changed later.
2. **Enable Google sign-in** (Authentication → Sign-in method).
3. **Add the authorized domain** `<user>.github.io` (Authentication → Settings). If you skip this, sign-in fails on the live site.
4. **Register a web app** (Project settings → Your apps) and copy the config values.
5. **Restrict the API key** (Google Cloud Console → APIs & Services → Credentials → the "Browser key"): allow only the HTTP referrers `https://<user>.github.io/*` and `http://localhost:*/*`. If you get this wrong, your own site gets blocked, so test right after.
6. **Deploy the rules:** `npx firebase login`, then `npx firebase deploy --only firestore:rules --project <real-project-id>`.
7. **Add members:** in the Firestore console, create an empty document `allowed_users/<their-gmail>` for each member.
8. **GitHub repo settings:**
   - Pages → Source: **GitHub Actions**.
   - Secrets and variables → Actions → **Variables**: `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`. These are Variables, not Secrets: the values are public in the bundle anyway.
9. **Add the deploy workflow** (below) and push to `main`.
10. **Move the data:** export everything from the emulator build, then sign in on the live site and restore. Alternatively, run the importer again.
11. **Smoke test on an iPhone and an Android phone:** sign in (popup), browse, add a recipe with a photo, edit the menu on one device and watch it appear on the other.

### `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ vars.FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ vars.FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ vars.FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_APP_ID: ${{ vars.FIREBASE_APP_ID }}
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

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
| `JamesIves/…` deploy to `gh-pages` with `contents: write` on Node 20 | Official Pages actions with narrow permissions on Node 22 (Node 20 reached end of life in Apr 2026) |
| No Vite `base`, no authorized domain, no SPA routing | All three are needed, or the site or sign-in breaks |
| WebP images | Safari can't produce WebP from a canvas, so JPEG |
