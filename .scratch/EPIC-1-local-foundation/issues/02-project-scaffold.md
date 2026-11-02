# 02: Project scaffold

Status: ready-for-agent
Story: US-1.1
Branch: `EPIC-1/US-1.1-project-scaffold`
Spec: [../spec.md](../spec.md)
Blocked by: 01

## What to build

- Vite + React + TypeScript + Mantine, using npm. Check current versions and setup steps against the official docs.
- React Router `HashRouter` with a single placeholder route.
- Vite `base: "/recipe-app/"`.
- A minimal Mantine theme (primary colour, font, radius) in one theme module.
- A phone-first layout baseline (viewport meta, no horizontal scroll at 360 px wide).
- TypeScript `strict` + `noUncheckedIndexedAccess`.
- Scripts `dev`, `build`, `preview`, `typecheck` (`tsc --noEmit`), `test`.
- Vitest with jsdom + React Testing Library and one smoke test that renders the app.
- Node pinned in `.nvmrc` and `package.json` `engines` (Node 26 LTS).
- A README covering prerequisites (Node 26, JDK 21), cloning, `.env` from `.env.example`, `npm install`, `npm run dev`. Later stories add the emulator, seed, phone-testing and offline-cache sections.

## Acceptance criteria

- [ ] `npm run dev` shows the placeholder page under `/recipe-app/#/`.
- [ ] `npm run typecheck`, `npm test` and `npm run build` pass.
- [ ] `npm run preview` serves the built app correctly under `/recipe-app/`.
- [ ] No `.js`/`.jsx` source files remain.

## Comments
