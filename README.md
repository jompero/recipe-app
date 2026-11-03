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
| `npm run typecheck` | Type-check everything (`tsc -b`) |
| `npm test` | Run the tests once (`npm run test:watch` to keep them running) |
| `npm run lint` | ESLint plus a Prettier formatting check |
| `npm run format` | Format everything with Prettier |
| `npm run check` | Typecheck, lint and test: what CI runs, minus the build |

A pre-commit hook (Husky + lint-staged) runs ESLint `--fix` and Prettier on the files you commit. ESLint also enforces the data boundary: only `src/data` and `src/config` may import Firebase.

## Pull requests

`main` only changes through pull requests, and CI (typecheck, lint, tests, build) must pass before merging. Dependabot opens grouped dependency updates weekly; they go through CI like any other PR.

## Pepperplate images

`node scripts/download-pepperplate-images.ts` downloads the recipe images linked from the Pepperplate export (`docs/pepperplate-data/`, not in git) into `.scratch/pepperplate-images/` (not in git). It's safe to re-run.
