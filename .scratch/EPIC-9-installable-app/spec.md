# EPIC-9: Installable Phone App

Status: ready

Replaces "Epic 9: Installable Phone App (PWA)" in `docs/backlog.md`. Settled in a grilling session on 2026-11-07. Related decisions: [ADR-0003](../../docs/adr/0003-google-sign-in-popup.md) (popup sign-in; may be amended, see "Sign-in"), [ADR-0004](../../docs/adr/0004-official-pages-actions-hashrouter.md) (hash routing, relative base), a new ADR-0009 (service-worker caching, written in 04).

## Problem Statement

Members cook from their iPhones. Today the app is a Safari tab: it has no icon of its own and no sense of being offline, and several small phone problems make it feel like a website rather than an app. Text boxes zoom in and stay zoomed, a fresh start lands on the menu instead of the cookbook, and the roller's Roll button is out of reach. A kitchen with weak Wi-Fi is exactly where the app is used, so members need to trust that it keeps working and see when changes are waiting to sync.

## Solution

Make the app installable from Safari (Share → Add to Home Screen) with the cast-iron pot icon, so it opens full screen like an app. A service worker keeps the app's own files on the phone, so it opens without a connection. Firestore's offline copy (on since Epic 1) already holds the data. A slim offline strip says when the app is working from that copy. Features that need the network say so when the phone is offline. A quiet banner offers a reload when a new version is deployed. The three phone problems from the Epic 7 smoke test are fixed along the way.

Before anything is built, the owner checks that Google sign-in works inside a home-screen app on a real iPhone (01). People reported failures of exactly this in 2025–2026, and there is no official word from Firebase.

## Build order

| Issue | Story | Who | Blocked by |
|---|---|---|---|
| 01 Sign-in check in a home-screen app | US-9.1 | owner | none |
| 02 Phone polish: input zoom, open on cookbook, Roll in reach | US-9.2 | agent | none |
| 03 App icon, favicon and page colours | US-9.3 | agent, then owner approves the favicon | none |
| 04 Manifest, service worker, update banner, ADR-0009 | US-9.4 | agent | 01, 03 |
| 05 Offline strip and network-only features | US-9.5 | agent | none |
| 06 "Install on your phone" note | US-9.6 | agent | 04 |
| 07 Smoke test on two iPhones | US-9.7 | owner + one member | 01–06 deployed |
| 08 Docs sweep | US-9.8 | agent | 07 |

02, 03 and 05 can start at once and in any order. 04 waits for 01: if sign-in fails in a home-screen app, a fallback issue (see "Sign-in") is written and slots in before 04, so nobody installs an app they can't sign in to. Anything the smoke test finds becomes a new numbered fix issue in this folder, `ready-for-agent`, and 08 waits for it.

## User Stories

1. As a member, I want to add the app to my iPhone home screen, so that I can open it like any other app.
2. As a member, I want the app to have its own recognisable icon, so that I can find it among my apps.
3. As a member, I want the installed app to open full screen without Safari's bars, so that recipes get the whole screen.
4. As a member, I want the installed app to open even with no connection, so that I can cook where the Wi-Fi doesn't reach.
5. As a member, I want to read recipes, the Plan and the grocery list offline, so that a dropped connection doesn't stop me mid-recipe or mid-shop.
6. As a member, I want to tick grocery items and change the Plan offline and have it sync later, so that I don't have to remember what I did.
7. As a member, I want a clear but quiet sign when I'm offline, so that I know my changes haven't reached the others yet.
8. As a member, I want the offline sign to go away by itself when I'm back online, so that I don't have to dismiss it.
9. As a member, I want features that can't work offline to say "Needs a connection", so that I don't wonder why they fail.
10. As a member, I want to keep pasting a photo by hand when the website photo can't be fetched, so that importing still works.
11. As a member, I want to be told when a new version is ready and choose when to reload, so that an update never interrupts cooking or an edit.
12. As a member, I want an update I ignore to apply the next time the app starts, so that I don't stay on an old version forever.
13. As a member, I want short instructions in the app for installing it, so that I don't need the owner to explain.
14. As a member, I want those instructions hidden once I've installed the app, so that they don't clutter it.
15. As a member, I want to be told that I sign in once more after installing, so that the second sign-in doesn't surprise me.
16. As a member, I want the screen to stay awake on a recipe in the installed app, as it does in Safari, so that I don't have to keep tapping it.
17. As a member, I want photos I've opened before to show offline, and thumbnails always, so that recipes still look right.
18. As a member, I want text boxes not to zoom in when I tap them, so that I don't have to pinch out after typing.
19. As a member, I want the app to open on the cookbook, so that it starts where I usually go.
20. As a member, I want the Roll button within reach on the roller, so that rolling again doesn't mean scrolling down each time.
21. As a member, I want the browser tab icon to be readable on a computer, so that I can find the tab.
22. As a member, I want the status bar to match the app's pages, so that the installed app looks finished.
23. As a member who uses Chrome on iOS, I want installing and using the app to work there too, so that I don't have to switch browsers.
24. As the owner, I want proof that Google sign-in works in a home-screen app before anything is built, so that the epic doesn't fail at the last step.
25. As the owner, I want the service worker never to touch Firebase traffic, so that sync and sign-in behave exactly as they do today.
26. As the owner, I want the caching rule written down as an ADR, so that a later change doesn't add a cache that breaks sync.
27. As the owner, I want the github.io fallback address to stay installable, so that the "If the domain dies" plan still holds.
28. As the owner, I want the icon files committed as the exact images I approved, so that nothing re-renders differently later.
29. As the owner, I want a member's phone in the smoke test, so that the install-and-sign-in-again flow is tested on a phone I don't control.

## Implementation Decisions

### Sign-in (01, maybe a fallback issue)

- Since iOS 26, any site added to the home screen opens as a web app, manifest or not. So the owner can test the live site today, before any Epic 9 code ships (01).
- A home-screen app has **storage separate from Safari** (WebKit bug 181849, still open). Members sign in once more after installing, and Firestore's offline copy starts empty there and rebuilds from the server. No data is lost. The install note (06) says so.
- If the popup sign-in works in the home-screen app: ADR-0003 stands and nothing changes.
- If it fails: write a fallback issue before 04. It gets a Google ID token directly from Google, without Firebase's helper page on `firebaseapp.com`, and passes it to Firebase with `signInWithCredential`. This is Firebase's "Option 5" in its redirect best-practices doc. It amends ADR-0003 (a dated amendment, as with ADR-0004). It must stay serverless (no proxy, CLAUDE.md), and the agent verifies the Google Identity Services API against current docs first.
- Also watch for a **slow start**: one 2026 report saw `getAuth`'s hidden helper iframe wait ~5 s on every launch in a home-screen app. 01 records how long the installed app takes to show the signed-in cookbook. If it's slow, the fallback issue (or a small one of its own) looks at initialising Auth without the popup/redirect resolver when running standalone.

### Install: manifest and service worker (04)

- `vite-plugin-pwa` (2.0.0 when checked on 2026-11-07, supports Vite 8). The agent re-checks the version and the docs before using it.
- `strategies: generateSW`: precache only the app's own build output (HTML, JS, CSS, fonts, icons). **No `runtimeCaching`.** Requests to Firestore, Firebase Auth and Google APIs aren't matched by any Workbox route, so they go to the network as if there were no service worker. The sign-in popup runs on `firebaseapp.com`, outside our scope.
- Navigation fallback to `index.html` (the plugin's default). With hash routing, every navigation is `index.html` anyway.
- **Relative everywhere:** manifest `start_url` and `scope` are `./`, and the service worker registers at `./sw.js` with scope `./`, all relative to the base `./`. The same build installs at `recipes.danijompero.com/` and at the github.io fallback. Only the custom domain is tested.
- Manifest: name "Family Recipes" (short name "Recipes", as in the page `<title>`; the agent checks what fits under an iPhone home-screen icon), `display: standalone`, `theme_color` and `background_color` both the app's page background (see "Colours"), and icons 192 and 512. The 512 is listed with `purpose` `any` and again as `maskable` (one image, designed inside the safe zone). iOS ignores maskable; it's there for Android, which stays untested.
- iOS uses the `apple-touch-icon` link (180 px, opaque) over manifest icons. No `apple-touch-startup-image` splash screens: iOS shows a blank screen in the page colour for a moment at launch.
- The service worker only runs in a secure context. `localhost` counts, but the LAN phone test (`http://<pc-ip>:5173/`) doesn't, so phone testing of the installed app happens on the live site. The dev server keeps the service worker off (the plugin's default), so dev and e2e behave as today.

### Updates (04)

- `registerType: prompt`. A new version waits. A quiet "Update ready · Reload" banner appears and stays until tapped. Tapping it activates the new service worker and reloads. If ignored, the new version takes over on the next fresh launch.
- iOS keeps home-screen apps suspended for days, so also check for an update when the app comes back to the foreground (visibility change), not only at launch.
- The banner never reloads by itself, so a half-finished edit or a grocery list being ticked is never lost.
- **ADR-0009** records the caching rule (precache own build only, never intercept or cache Firebase/Google traffic, Firestore's own offline copy is the data cache) and prompt-style updates. Reason: a broad cache rule would break Firestore sync or serve stale data.

### Offline strip and network-only features (05)

- **Offline strip:** a slim strip under the menu button, "Offline: changes will sync when you're back online". It shows on every member page while offline and goes away by itself.
- **The signal:** `navigator.onLine` is unreliable (MDN: true doesn't mean internet, e.g. Wi-Fi with no connection), so the strip is driven mainly by Firestore. The always-on recipes listener (it feeds the cookbook) also listens for metadata changes. When its snapshot says `fromCache`, the app is working from the offline copy. The phone's `offline`/`online` events give a quicker hint. The strip shows when either says offline.
- Firestore reports `fromCache` for a moment on every cold start, before it reaches the server. So the Firestore signal must hold for a few seconds before the strip appears. The phone's "offline" shows at once.
- Pending writes alone don't show the strip: online, they clear within a second, so they'd only make it flicker. Offline, the strip's own text covers them.
- `src/data` remains the only code that imports Firebase. It exposes the sync signal; components don't read snapshot metadata.
- **Network-only features** are disabled with a short "Needs a connection" note **only when the phone itself reports offline**. A false "offline" is reliable; a true "online" isn't, so otherwise they try and show their usual errors. The features:
  - signing in
  - fetching a recipe website's photo on `#/import`. Paste or drop by hand stays available.
  - the Data page's Pepperplate import and Restore
- Export works from the offline copy and stays enabled.
- **Photos:** nothing is pre-downloaded. Thumbnails live on the recipe document, so they're always there. A full-size photo (`recipe_images`) shows offline only if it was opened before on that phone; otherwise the recipe page shows the thumbnail.

### Install note (06)

- A short "Install on your phone" section on the Data page:
  - In Safari or Chrome, tap Share → Add to Home Screen, with "Open as Web App" on.
  - Open the app from the home screen.
  - Sign in once more.
- Hidden when running as an installed app (`display-mode: standalone`, or iOS's `navigator.standalone`).

### Icon, favicon and colours (03)

- Commit the images from `.scratch/pwa-icon/` exactly as approved (`icon.svg`, `icon-512.png`, `icon-192.png`, `apple-touch-icon-180.png`) to Vite's `public/` folder, so they're served at the base unchanged. Bring the design notes along as a short doc (`docs/project/app-icon.md`): colours, safe zone, rejected options. The generator scripts stay out of the repo.
- **Favicon:** a new, simple SVG: flat black pot and oak handle (`#c39a6b`) on the dark green (`#18251f`), no gradients, readable at 16–32 px. Plus a PNG fallback if the agent finds Safari on desktop needs one. The owner approves it from a preview before merge.
- **Colours:** `theme-color` (the iPhone status bar) and the manifest's `theme_color` and `background_color` are the app's own page background, so the status bar blends into the Book pages. This replaces the leftover Mantine orange `#fd7e14` in `index.html`. The darker icon greens stay in the icon only.
- No `black-translucent` status bar (that would put content under the clock and need safe-area padding everywhere).

### Phone polish (02)

- **Input zoom:** iOS zooms when a focused text box has text smaller than 16 px. Give text inputs, text areas and selects at least 16 px on touch screens, through the Mantine theme, not one component at a time. **Don't** block zoom in the viewport tag (it breaks pinch-zoom for accessibility).
- **Open on the cookbook:** a fresh start lands on the cookbook instead of opening with the menu overlay (`MemberShell`). This was the original plan; the menu button stays.
- **Roll in reach:** on `#/plan/roll`, the Roll again button stays reachable without scrolling. It can sit at the top or be sticky; the agent picks whichever fits the page, and the owner checks it on a phone in 07.

## Testing Decisions

- Good tests check what a member sees and does (the strip appears, a button is disabled with its note, the banner reloads), not how the hook or the service worker is wired.
- **Sync signal** (05): unit tests with fake timers for the rules: the Firestore offline signal must hold before the strip shows, the phone's offline shows at once, and back online hides it. Prior art: `useWakeLock.test.ts` (browser APIs faked in jsdom), `useTicks`.
- **Offline strip and disabled features** (05): component tests in the style of `DataPage.test.tsx` and `ImportPage.test.tsx`, with the signal faked.
- **Offline end-to-end** (05): a Playwright test that loads the app, goes offline with `context.setOffline(true)`, checks the strip appears and a recipe still opens, then goes back online and checks it disappears. Prior art: `e2e/plan-live-sync.spec.ts`. The dev server has no service worker, so this tests the data side, not the app shell.
- **Update banner** (04): a component test with `virtual:pwa-register/react` mocked. Shown when a new version waits, and tapping Reload calls the update.
- **Build check** (04): `npm run build` outputs the manifest, `sw.js` and a precache list. All paths are relative (no `/recipe-app/`, no leading `/`). Nothing from `googleapis.com` or `firebaseapp.com` appears in the precache or routes. `npm run preview` installs the service worker (DevTools → Application) and reloads offline.
- **Phone polish** (02): component tests where they fit (opening on the cookbook; the Roll button rendered before the list). Input zoom is checked by the owner on a phone in 07.
- Icons, favicon, install, Wake Lock and real offline use are checked by hand: the owner in 01 and 07, with a member's iPhone in 07.

## Out of Scope

- Android: the maskable icon is declared, but nothing is tested on Android.
- iPad and desktop layout: still in the backlog.
- Splash screens (`apple-touch-startup-image`).
- Pre-downloading photos, or any offline cache beyond Firestore's own copy and the precached app files.
- Push notifications, background sync, badges, share targets.
- An in-app hint about Low Power Mode blocking Wake Lock (declined in Epic 8).
- Generating icons at build time (`@vite-pwa/assets-generator`).
- A custom `authDomain` or self-hosting Firebase's `/__/auth` helper pages.

## Further Notes

- **Research behind these decisions** (2026-11-07, primary sources where they exist):
  - `vite-plugin-pwa` 2.0.0 source (it keeps the relative base).
  - WebKit blog: Safari 26 opens any home-screen site as a web app. Home-screen apps have their own 7-day storage counter. Storage quota since iOS 17.
  - WebKit bug 254545: Wake Lock in home-screen apps fixed in iOS 18.4.
  - MDN on `navigator.onLine`.
  - Firebase docs on snapshot metadata and redirect best practices.
  - firt.dev's iOS PWA notes (iOS ignores `maskable` and `background_color`; `apple-touch-icon` wins).
  - 2026 GitHub reports of Firebase sign-in failing in iOS home-screen apps.
- **Wake Lock:** works in home-screen apps since iOS 18.4, so `useWakeLock` needs no change. 07 checks it with Low Power Mode **off** (iOS refuses wake locks in Low Power Mode).
- The `.scratch/pwa-icon/` folder is hidden from git by a local `.git/info/exclude` line. 08 replaces that line with a `.gitignore` entry, so the leftover generator scripts stay out of the repo on every machine.
