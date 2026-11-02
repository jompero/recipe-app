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

- [ ] `npm run emulators` starts Auth, Firestore and the UI; data written before a clean stop is there after a restart.
- [ ] `npm run seed` twice in a row leaves the same documents, visible in the Emulator UI.
- [ ] The app loads with the emulator connected (no Firebase warnings about a real project).
- [ ] No real emails anywhere in the repo.

## Comments
