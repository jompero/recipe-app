# 04: Firebase Emulator

Status: ready-for-agent
Story: US-1.2
Branch: `EPIC-1/US-1.2-firebase-emulator`
Spec: [../spec.md](../spec.md)
Blocked by: 03

## What to build

- `firebase-tools` as a devDependency (if not already added in 03), used through `npx`.
- `firebase.json`: Firestore rules file reference; Auth emulator on 9099 and Firestore on 8080, both bound to `0.0.0.0`; Emulator UI enabled. Project `demo-recipe-app` (via `.firebaserc` or `--project`).
- An npm script that starts the emulators with `--import=.emulator-data --export-on-exit` (`.emulator-data/` is already gitignored).
- The Firebase config module: initialise from `import.meta.env.VITE_FIREBASE_*`; Firestore with `persistentLocalCache` + `persistentMultipleTabManager` in every mode; when `VITE_USE_EMULATOR=true`, connect Auth and Firestore emulators to `window.location.hostname`. Check every API name against current Firebase docs.
- A typed declaration for the `VITE_*` env variables.
- `npm run seed`: writes `allowed_users` documents for fake `@example.com` addresses into the running emulator, bypassing rules. Safe to re-run.
- README sections: starting the emulator, seeding, the offline-cache gotcha (clear site data after resetting the emulator), and phone testing (`vite --host`, Windows Firewall inbound rules for 5173/9099/8080 on private networks).

## Acceptance criteria

- [x] `npm run emulators` starts Auth, Firestore and the UI; data written before a clean stop is there after a restart.
- [x] `npm run seed` twice in a row leaves the same documents, visible in the Emulator UI.
- [x] The app loads with the emulator connected (confirmed by the owner's US-1.6 sign-in checks on desktop and phone, 2026-11-03).
- [x] No real emails anywhere in the repo.

## Comments

**2026-11-03 (agent, from US-1.4):** CI currently runs `npm test` directly, because `emulators:exec` needs the `firebase.json` this story adds. This story must also: add `actions/setup-java` (Temurin, **21**: firebase-tools 15.34 requires JDK 21+) to `.github/workflows/ci.yml`, and wrap the test step in `npx firebase emulators:exec --project demo-recipe-app --only auth,firestore "npm test"`. firebase-tools 15.34.2 is already a devDependency (added in US-1.4).

**2026-11-03 (agent):** firebase 13.2 SDK, firebase-tools 15.34. API names checked against the installed type definitions (`initializeFirestore`, `persistentLocalCache`, `persistentMultipleTabManager`, `connectFirestoreEmulator(db, host, port)`, `connectAuthEmulator(auth, url, { disableWarnings })`). `firebase.json` uses `singleProjectMode` (checked in the firebase-tools schema); `.firebaserc` defaults to `demo-recipe-app`. `firestore.rules` is a deny-all placeholder until US-1.3. The seed script is dependency-free: it calls the emulator REST API with `Authorization: Bearer owner`, which bypasses rules. Verified: seeding twice leaves exactly 2 docs; a client without the owner token gets 403; export, stop, restart re-imports both docs; `npm run test:ci` (emulators:exec) passes. A hard kill skips `--export-on-exit`, so there's `npm run emulators:save` plus a README note. `@firebase/util`'s postinstall (App Hosting auto-config only) is denied in `allowScripts`. CI now sets up Temurin 21 via `actions/setup-java@v6` and runs `npm run test:ci`.
