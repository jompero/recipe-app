# Recipe App — Shared Serverless Recipe Planner

A recipe app and meal planner shared by a small, whitelisted group. It is a static React + TypeScript + Vite site hosted on GitHub Pages, with Firebase **Auth and Firestore only** (Spark plan, no Storage) as the backend. There is no custom server, so all logic runs in the browser.

## Status
Epic 1 (Local Foundation) is built: Vite + React + Mantine scaffold, ESLint/Prettier/Husky, CI with a required `check` job on a protected `main`, the Firebase Emulator with seed data, the allowlist security rules with tests, and the Google sign-in shell. Spec and per-story notes: `.scratch/EPIC-1-local-foundation/`. Epic 2 (Pepperplate Import) is built: the recipe and ingredient parsers, the image compressor, the recipes/images/backup data modules with rules shape validation, the Data page (Pepperplate import, export, restore), and `npm run seed` loading the gitignored base-data export into an empty emulator. Spec and per-story notes: `.scratch/EPIC-2-pepperplate-import/`. Epic 3 (Recipe Browser) is built: the Nordic "Book" theme with bundled fonts, the one-button menu overlay (it names the current page), the cookbook grid and A–Z list with search/tags/sort in the URL, the recipe page (scaling, tick-off lines, screen kept awake), edit and new recipe with a discard prompt, and archive/unarchive. Routing uses `createHashRouter`. Spec and per-story notes: `.scratch/EPIC-3-recipe-browser/`. Next up: Epic 4 (Recipe Input), starting by turning its backlog draft into a spec. Architecture was settled in a Nov 2026 plan review (see `docs/adr/`).

## Key docs (read before working on a feature)
- `docs/adr/`: the settled architecture decisions. Flag any conflict with them explicitly; don't silently override.
- `docs/backlog.md`: **placeholder** draft of Epics 1–8. The epic order is settled, the stories are not. Each epic will be grilled through one at a time and replaced by a proper spec; treat the draft as a starting point for that conversation, not as requirements to build from.
- `docs/project/blueprint.md`: architecture, code structure, the Firestore schema (`recipes`, `recipe_images`, `menu_days`, `allowed_users`), and the free-tier budget.
- `docs/project/project-setup.md`: the reference `firebase.ts`, `firestore.rules`, the CI and deploy workflows, and the go-live checklist.
- Specs and issues for in-flight work live under `.scratch/` (see Agent skills below).

## Planned layout
- `src/config/firebase.ts`: Firebase init from `import.meta.env.VITE_FIREBASE_*`; connects to the emulator when `VITE_USE_EMULATOR=true`
- `src/data/*.ts`: the **only** code that imports Firebase (`recipes`, `images`, `menu`, `backup`). Components call `src/data`, never Firebase directly.
- `src/utils/imageCompressor.ts`: `browser-image-compression`, **JPEG** (not WebP): full ~1024px / ~100–300KB, thumbnail ~320px / ~15–40KB
- `src/parsing/`: recipe and ingredient parsers, shared by the Pepperplate importer and Quick Paste
- `src/components/*.tsx`: Mantine UI, designed for phones first, hash routing (`createHashRouter`, route tree in `src/routes.tsx`)

## Rules
- **Never edit `docs/pepperplate-data/`.** It is the user's original Pepperplate export (198 `.txt` recipes plus a zip). Copy from it, never modify it. It is the seed data for importing into the final format. Downloaded images go to gitignored `.scratch/pepperplate-images/`.
- **Local-first:** Epics 1–6 run only against the Firebase Emulator (`demo-recipe-app`). Don't create or connect a real Firebase project, or deploy, before Epic 7 (Go-live).
- **Config is not secret, emails are:** the Firebase web config ships in the public bundle; `.env` is for convenience (see `.env.example`), and CI reads it from GitHub Actions *variables*. Security comes only from `firestore.rules` plus the API key restriction. Never commit real whitelisted emails: membership lives in the `allowed_users` Firestore collection, edited in the console.
- **Stay on the Spark free tier:** no Firebase Storage, no Cloud Functions, no server of any kind (not even a free proxy), no paid services. Images are stored as base64 in Firestore (ADR-0001).
- **Verify Firebase and GitHub APIs and versions against current docs.** The original docs were AI-generated and contained hallucinations. Don't trust remembered API names or action versions.
- Deploys (from Epic 7) use GitHub's official Pages actions: on a push to `main`, Actions builds `dist/` and deploys it. No `gh-pages` branch.
- Work on feature branches. Pull requests must pass CI (typecheck, lint, tests including rules tests against the emulator, build) before merging to `main`.
- Put epic/story IDs in branch names and commit messages, in the form `EPIC-2` and `US-2.4` (story 4 of epic 2). Take the numbers from the epic's spec once it exists.

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five triage roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), recorded as a `Status:` line. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` plus `docs/adr/` at the repo root. See `docs/agents/domain.md`.
