# The service worker caches only the app's own files, and updates wait for the member

The app becomes installable in Epic 9 with `vite-plugin-pwa`, and its service worker does one job: it precaches this build's own files (HTML, JS, CSS, the Latin fonts, the icons), so the installed app opens without a connection. It has **no runtime caching**. Requests to Firestore, Firebase Auth and Google APIs match no route, so they go straight to the network as if there were no service worker. The data cache is Firestore's own offline copy (`persistentLocalCache`, on since Epic 1), which already knows which data is current. Caching or intercepting that traffic as well would give a second cache that can go stale or break Firestore's listen streams and the sign-in popup. Updates use the plugin's `prompt` mode: a new version waits, the update banner offers Reload, and an ignored update takes over on the next fresh launch. Every merge to `main` deploys within minutes, so an automatic reload could hit a member in the middle of an edit or the grocery list.

## Consequences

- Any future `runtimeCaching` rule must leave out `*.googleapis.com`, `*.firebaseapp.com` and `/__/auth`. Self-hosting Firebase's auth helper under `/__/auth` would also need `navigateFallbackDenylist: [/^\/__\//]`.
- The service worker is off in dev, so the dev server and e2e run without one. The LAN phone test (`http://<pc-ip>:5173/`) isn't a secure context and can't run one either. `npm run preview` and the live site are where the service worker can be tried out.
- Paths stay relative (`start_url`, `scope` and the registration are all `./`, with the base `./` from ADR-0004). The same build installs at `recipes.danijompero.com` and at the github.io fallback, but an installed app belongs to its origin, so moving domains means installing again.
- Cyrillic, Greek and Vietnamese font files are left out of the precache. The recipes don't use them, and they still load online if a page ever needs them.
- iOS keeps home-screen apps suspended for days, so the app also checks for a new version each time it comes back into view, not only at launch.
