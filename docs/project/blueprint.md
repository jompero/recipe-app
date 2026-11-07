# Project Blueprint: Shared Serverless Recipe Planner

A shared recipe app and meal planner for a small, whitelisted group. It is a static React site on **GitHub Pages**, and its only backend is **Firebase** (Auth and Firestore) on the free **Spark** plan. There is no server, so all logic runs in the browser.

The decisions behind this design are in [`docs/adr/`](../adr/). This document was first drafted by Gemini, then corrected after a review in Nov 2026. The main corrections:
- Firebase Storage is no longer free (it needs Blaze since Feb 2026), so images live in Firestore.
- The Firebase config is public by design.
- The menu schema now supports any date range.

---

## Architecture

| Layer | Technology | Notes |
|---|---|---|
| Hosting | GitHub Pages, deployed by GitHub's official Pages actions | Public repo, hash routing (`createHashRouter`), Vite `base` = `/<repo-name>/` ([ADR-0004](../adr/0004-official-pages-actions-hashrouter.md)) |
| UI | React, TypeScript, Vite, Mantine (custom theme) | Designed for phones first. English UI, metric by default. |
| Auth | Firebase Auth, Google sign-in via `signInWithPopup` | [ADR-0003](../adr/0003-google-sign-in-popup.md) |
| Data | Cloud Firestore in `europe-west2` (London) | Offline copy on the device via `persistentLocalCache`. The region is permanent. |
| Images | Base64 JPEG stored in Firestore | No Firebase Storage ([ADR-0001](../adr/0001-images-in-firestore-not-storage.md)) |
| Security | Firestore Security Rules + an `allowed_users` collection | [ADR-0002](../adr/0002-allowlist-collection.md) |
| Development | Firebase Emulator Suite (`demo-recipe-app`) | Always; the live project (`family-recipes-64bda`) is only reached by the deployed site and `npm run deploy:rules` ([ADR-0007](../adr/0007-local-first-until-go-live.md)) |

### Things that are *not* true (corrections to the original draft)

- **The Firebase web config is not a secret.** Vite bakes it into the public JavaScript bundle. The only protections are the Security Rules plus restricting the API key to the site's domains. Env vars are just for convenience.
- **Firestore does not use WebSockets.** The web SDK uses its own streaming transport. This doesn't affect the app, but don't build on the claim.
- **Free tier ≠ Storage.** Since 3 Feb 2026, any use of Cloud Storage for Firebase needs Blaze.
- **Storage download URLs would ignore the rules** (anyone with the URL can view the file). Images in Firestore are covered by the rules instead.

---

## Code structure

```
src/
  config/firebase.ts     Firebase init; connects to the emulator when VITE_USE_EMULATOR=true
  data/                  The ONLY place that imports firebase/firestore or firebase/auth
    recipes.ts           CRUD, archive, live list of active recipes
    images.ts            Compress, save and load thumbnail and full image (the migration seam)
    menu.ts              The Plan: live range of menu_days, add/remove/move entries, set a scale, save a roll (arrayUnion/arrayRemove, batches)
    groceries.ts         The grocery list: live grocery_lists/current, replace/add lines, tick, add by hand, remove, clear
    backup.ts            Export everything to JSON, restore
  utils/imageCompressor.ts   browser-image-compression: JPEG, ~1024px full / ~320px thumbnail
  parsing/               Ingredient and recipe text parsers (shared by the Pepperplate import and Quick Paste)
  plan/                  The Plan's pure logic: week dates, note rules, the roller's picking rules
  groceries/             The grocery list's pure logic: merge keys, unit conversion, merged and by-recipe views, the builder's lines
  components/ …          UI only; calls src/data, never Firebase directly
```

Components never call Firebase directly. Keeping it in one module puts every Firebase call in one reviewable place. It also lets tests replace Firebase with a fake, and makes a later storage move cheap.

---

## Data flow

```mermaid
flowchart TD
    classDef client fill:#e1f5fe,stroke:#03a9f4,stroke-width:2px,color:#000;
    classDef firebase fill:#fff9c4,stroke:#fbc02d,stroke-width:2px,color:#000;
    classDef secure fill:#e8f5e9,stroke:#4caf50,stroke-width:2px,color:#000;

    subgraph Browser ["Browser (React + src/data)"]
        A[Pick photo / enter or paste recipe] --> B(imageCompressor:<br/>full ~1024px JPEG + thumb ~320px)
        A --> P(parser: raw lines → qty/unit/item)
        B --> C{src/data}
        P --> C
    end

    subgraph Firebase ["Firebase (Spark plan)"]
        G[Security Rules:<br/>email_verified + allowed_users]
        F[(recipes<br/>incl. thumbnail)]
        I[(recipe_images<br/>full photo)]
        M[(menu_days)]
        L[(grocery_lists)]
    end

    C -->|batched write| G
    G --> F
    G --> I
    C -->|setDoc / arrayUnion| G
    G --> M
    G --> L

    class A,B,P,C client;
    class F,I,M,L firebase;
    class G secure;
```

Live updates: the recipe list, the visible range of the menu and the grocery list use `onSnapshot`, so a change on one device appears on the others within about a second. Firestore's offline copy shows cached data and queues writes while the device is offline.

---

## Firestore schema

`recipes` and `recipe_images` are final (Epic 2, enforced by `firestore.rules`). `menu_days` is final too (Epic 5, ADR-0006 amendments, shape checked by `firestore.rules`), and so is `grocery_lists` (Epic 6, ADR-0008).

```jsonc
// recipes/{id}   id = kebab-case of the Pepperplate file name for imported recipes, auto ID otherwise
{
  "title": "15 Min Pulled Oats & Mushroom Pasta",   // non-empty
  "description": "",                         // imported Notes are added after a blank line
  "source": "", "sourceUrl": "",
  "yield": "", "activeTime": "", "totalTime": "",   // free text, as written
  "tags": ["pasta"],                         // lowercase
  "ingredients": [
    { "raw": "400 g Pasta (Clam shaped)", "qty": 400, "unit": "g", "item": "Pasta (Clam shaped)" },
    { "header": "For the sauce" },
    { "raw": "1-2 cloves garlic", "qty": 1, "qtyMax": 2, "unit": "clove", "item": "garlic" },
    { "raw": "Salt & pepper", "item": "Salt & pepper" }
  ],
  "instructions": [ { "text": "Boil pasta until al dente and drain" }, { "header": "While pasta is boiling" }, { "text": "…" } ],
  "thumbnail": "data:image/jpeg;base64,…",   // ~15–40 KB, at most 60,000 characters, or null
  "hasImage": true,                          // full image is in recipe_images/{same id}
  "archived": false,                         // archive instead of delete; the rules deny deletes
  "createdAt": "<timestamp>", "updatedAt": "<timestamp>"
}

// recipe_images/{recipeId}
{ "data": "data:image/jpeg;base64,…" }        // ~100–300 KB, at most 900,000 characters (document limit 1 MiB)

// menu_days/{YYYY-MM-DD}
{
  "entries": [                               // at most 20; order added; [] once the last is removed
    { "id": "k3f9x2", "recipeId": "abc123" },  // id: random, made in the browser
    { "id": "m7c1aa", "recipeId": "def456", "scale": 2 },  // scale 0.5, 2 or 3; none = 1×
    { "id": "p81qza", "note": "Leftovers" }    // note: 1–80 characters
  ],
  "updatedAt": "<timestamp>"
}

// grocery_lists/current   (the only document; merged in the browser, ADR-0008)
{
  "lines": [                                 // at most 600; source lines, merged when shown
    { "id": "a8k2pq", "raw": "1 cup milk", "scale": 2, "recipeId": "pancakes", "title": "Pancakes", "entryId": "k3f9x2" },
    { "id": "z0m4tt", "raw": "toilet paper", "scale": 1 }   // added by hand
  ],
  "ticked": ["a8k2pq"],                      // at most 600; line ids; missing until the first tick
  "updatedAt": "<timestamp>"
}

// allowed_users/{email}   (edited by hand in the console; never in the repo)
{ }
```

Rules of thumb:
- If two people edit the same recipe at once, the last save wins.
- Menu entries, grocery lines and ticks are added with `arrayUnion` and removed with `arrayRemove`.
- Use `serverTimestamp()`, not ISO strings written by the browser.

---

## Free-tier budget (Spark)

| Quota | Limit | Expected use |
|---|---|---|
| Firestore storage | 1 GiB | ~200 recipes × up to ~450 KB (base64 full image + thumbnail) ≈ 90 MB at most |
| Reads | 50,000/day | ~200 per app open (recipe list) plus full images on demand |
| Writes | 20,000/day | Tiny. The one-off import is ~400. |
| GitHub Pages | 1 GB site, ~100 GB/month soft limit | Tiny |

If a quota runs out, the app stops until the daily reset. Nothing gets billed, because there's no billing account.

---

## Security model

- Everyone signs in with Google. The rules require `request.auth.token.email_verified == true` **and** a document at `allowed_users/{email}`.
- Each collection gets its own explicit rule. There's no `{document=**}` catch-all, so members can't add themselves or others to `allowed_users`.
- The API key is restricted (in Google Cloud Console) to the referrers `https://jompero.github.io/*` and `https://family-recipes-64bda.firebaseapp.com/*` (the sign-in popup's handler page), and to the APIs Firebase set on it. No `localhost`: development uses the emulator.
- Rules are tested automatically against the emulator in CI, and deployed to the live project by hand (`npm run deploy:rules`).

The rules text is in [project-setup.md](project-setup.md).

---

## Backups

Firestore on Spark has no point-in-time recovery or scheduled backups. The app has an **"Export everything"** button that downloads one JSON file of recipes, images and menus, and the importer can restore from it. Run an export before risky changes. The Pepperplate originals in `docs/pepperplate-data/` are a last-resort copy of the seed data.
