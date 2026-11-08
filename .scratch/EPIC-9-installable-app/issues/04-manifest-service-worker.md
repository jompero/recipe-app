# 04: Manifest, service worker, update banner, ADR-0009

Status: done
Story: US-9.4
Branch: `EPIC-9/US-9.4-pwa`
Spec: [../spec.md](../spec.md) (Install, Updates)
Blocked by: 01 (sign-in works in a home-screen app, or its fallback issue is done), 03 (icons in `public/`)

## What to build

- Add `vite-plugin-pwa` (and `workbox-window`, which its React register hook needs). **First check the current version, peer range and docs** (vite-pwa-org.netlify.app, the GitHub releases). 2.0.0 was current on 2026-11-07. Don't trust remembered option names.
- **Plugin settings:**
  - `strategies: generateSW`, no `runtimeCaching`, navigation fallback to `index.html`.
  - `registerType: prompt`.
  - Service worker off in dev, so the dev server and e2e behave as today.
  - The precache includes the bundled fonts and icons, nothing from other origins.
- **Manifest:**
  - name "Family Recipes", short name "Recipes" (check what fits under an iPhone icon)
  - `display: standalone`
  - `start_url` and `scope` `./`
  - `theme_color` and `background_color` as in 03
  - icons 192 and 512, with the 512 also listed as `maskable`
- **Update banner:** with `useRegisterSW` (`virtual:pwa-register/react`), show a quiet "Update ready · Reload" strip when a new version waits. Tapping Reload activates it and reloads. It never reloads by itself. Also call the registration's `update()` when the page becomes visible again (iOS keeps home-screen apps suspended for days). Keep the register code out of `src/data`; it isn't Firebase.
- **ADR-0009** "The service worker caches only the app's own files":
  - Precache the build output only.
  - Never match, cache or intercept Firestore, Firebase Auth or Google traffic. Firestore's offline copy is the data cache.
  - Updates are prompted, never forced.
  - Write it in the same style as ADR-0008, with Consequences: the LAN phone test has no service worker (not a secure context), and a future `runtimeCaching` rule must exclude `*.googleapis.com` and `*.firebaseapp.com`.
- GLOSSARY: add **Installed app** (the app opened from the home screen, with its own storage and sign-in) and **Update banner**. Run the `domain-modeling` skill's conventions.

## Acceptance criteria

- [x] `npm run build` outputs `manifest.webmanifest`, `sw.js` and a precache list. Every path in them and in `dist/index.html` is relative (no leading `/`, no `/recipe-app/`). Nothing from `googleapis.com` or `firebaseapp.com` appears in the service worker.
- [x] `npm run preview`: DevTools → Application shows the manifest with its icons, and an active service worker. With "Offline" ticked, a reload still loads the app shell.
- [x] Building and previewing a changed build shows the update banner, and Reload switches to the new version.
- [x] Component test for the banner, with the register module mocked: shown when a new version waits, Reload calls the update.
- [x] `npm run check` and `npm run e2e` pass.
- [x] After merging: the deploy run is green, and `https://recipes.danijompero.com/` serves the manifest and `sw.js`. Record the run link under Comments.

## Comments

**2026-11-07 (agent):** Merged in PR #62.
- **Setup:** `vite-plugin-pwa` 2.0.0 with `workbox-window` 7.4.1, checked on npm (peer range includes Vite 8). `generateSW`, `registerType: prompt`, `injectRegister: false`, and no runtime caching.
- **Precache:** 23 entries (2.4 MB uncompressed, about 450 KB over the network).
  - The non-Latin font files are left out with `globIgnores`. Without that it was 2.7 MB.
  - `sw.js` has no `googleapis` or `firebaseapp` URLs.
- **Update banner:** at the top, outside the router, so it also shows on the sign-in screens. It checks for an update on `visibilitychange`. In dev and Vitest the plugin's register hook does nothing.
- **Checked in real Chromium** with two demo-config builds served from the same address:
  - the service worker is active with scope `/`, and `start_url`/`scope` are `./`
  - an offline reload loads the app with the Book fonts
  - deploying build B shows the banner, and Reload switches to it
  - the same build under `/recipe-app/` has scope `/recipe-app/` and reloads offline
- Also: ADR-0009, and the GLOSSARY terms Installed app and Update banner.
- **Merge danger:** reverting doesn't remove an installed service worker from phones. A rollback would need a self-destroying service worker deploy.
- `vite-plugin-pwa` adds 4 low or moderate `npm audit` findings, all in build-time dependencies.
- The deploy run was green and the live site serves `manifest.webmanifest` and `sw.js`.
