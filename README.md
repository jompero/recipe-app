# Recipe App

A shared recipe app and meal planner for a small group. It's a static React + TypeScript + Vite site, with Firebase Auth and Firestore as the only backend. Architecture and decisions: [`docs/project/blueprint.md`](docs/project/blueprint.md) and [`docs/adr/`](docs/adr/).

Until go-live (Epic 7), everything runs locally against the Firebase Emulator. No Firebase account is needed.

## Prerequisites

- **Node.js 26** (the version is pinned in `.nvmrc`). On Windows: `winget install OpenJS.NodeJS.LTS`
- **Java JDK 21**, needed by the Firebase Emulator. On Windows: `winget install EclipseAdoptium.Temurin.21.JDK`

After installing, restart your terminal (in VS Code, restart VS Code itself) so the new `PATH` is picked up.

**Windows PowerShell:** if `npm` fails with "running scripts is disabled on this system", allow local scripts for your account once with `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (or use Git Bash). Windows PowerShell 5.1 also doesn't support `&&`; use `;` instead.

## Getting started

```sh
git clone https://github.com/jompero/recipe-app.git
cd recipe-app
cp .env.example .env   # dummy values that point the app at the local emulator
npm install
npm run dev
```

Open http://localhost:5173/recipe-app/. The `/recipe-app/` path matches the GitHub Pages URL, and routes live after `#` (for example `/recipe-app/#/recipes/123`).

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Build the static site into `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm run emulators` | Start the Firebase emulators with saved data |
| `npm run emulators:save` | Save the running emulators' data to `.emulator-data/` |
| `npm run seed` | Add fake allowlist members to the running emulator |
| `npm run typecheck` | Type-check everything (`tsc -b`) |
| `npm test` | Run the tests once (`npm run test:watch` to keep them running) |
| `npm run test:ci` | Run the tests inside the emulators, as CI does |
| `npm run lint` | ESLint plus a Prettier formatting check |
| `npm run format` | Format everything with Prettier |
| `npm run check` | Typecheck, lint and test: what CI runs, minus the build |

A pre-commit hook (Husky + lint-staged) runs ESLint `--fix` and Prettier on the files you commit. ESLint also enforces the data boundary: only `src/data` and `src/config` may import Firebase.

## Pull requests

`main` only changes through pull requests, and CI (typecheck, lint, tests, build) must pass before merging. Dependabot opens grouped dependency updates weekly; they go through CI like any other PR.

## Local Firebase (emulator)

The app talks to the Firebase Emulator Suite (Auth + Firestore) under the offline-only project `demo-recipe-app`. No real Firebase project is involved.

```sh
npm run emulators   # terminal 1: Auth on :9099, Firestore on :8080, Emulator UI on http://localhost:4000
npm run seed        # terminal 2, once: adds fake members to allowed_users
npm run dev         # terminal 2
```

- **Seeded members:** `member@example.com` and `alex@example.com`. In the emulator's Google sign-in popup, choose "Add new account" and enter one of these to sign in as a member; any other email is a non-member. `npm run seed` is safe to re-run.
- **Data survives restarts:** it's loaded from `.emulator-data/` (gitignored) on start and saved back when you stop the emulators with **Ctrl+C** (wait for "Export complete"). Closing the terminal window instead skips the save, so run `npm run emulators:save` first if you've added data you want to keep.
- **Starting over:** stop the emulators, delete `.emulator-data/`, start again and re-seed.
- **Offline cache gotcha:** the app keeps an offline copy of Firestore data in the browser (IndexedDB). After wiping the emulator, the browser keeps showing the old documents until you clear the site data (DevTools → Application → Storage → Clear site data).
- **Tests with the emulator:** `npm run test:ci` starts the emulators, runs the tests and stops them. This is what CI runs.

## Testing on your phone

1. Allow inbound connections on private networks for ports **5173** (Vite), **9099** (Auth emulator) and **8080** (Firestore emulator). In an admin PowerShell:
   ```powershell
   New-NetFirewallRule -DisplayName "recipe-app dev" -Direction Inbound -Protocol TCP -LocalPort 5173,9099,8080 -Profile Private -Action Allow
   ```
2. Make sure your Wi-Fi network is set to **Private** in Windows settings.
3. Run `npm run emulators` and `npm run dev -- --host`, then open the "Network" address Vite prints (`http://<pc-ip>:5173/recipe-app/`) on your phone. The app connects to the emulator on the same host it was loaded from.

## Pepperplate images

`node scripts/download-pepperplate-images.ts` downloads the recipe images linked from the Pepperplate export (`docs/pepperplate-data/`, not in git) into `.scratch/pepperplate-images/` (not in git). It's safe to re-run.
