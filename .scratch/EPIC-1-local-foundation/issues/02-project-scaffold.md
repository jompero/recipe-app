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
- Scripts `dev`, `build`, `preview`, `typecheck` (`tsc -b`, see Comments), `test`.
- Vitest with jsdom + React Testing Library and one smoke test that renders the app.
- Node pinned in `.nvmrc` and `package.json` `engines` (Node 26 LTS).
- A README covering prerequisites (Node 26, JDK 21), cloning, `.env` from `.env.example`, `npm install`, `npm run dev`. Later stories add the emulator, seed, phone-testing and offline-cache sections.

## Acceptance criteria

- [x] `npm run dev` shows the placeholder page under `/recipe-app/#/`.
- [x] `npm run typecheck`, `npm test` and `npm run build` pass.
- [x] `npm run preview` serves the built app correctly under `/recipe-app/`.
- [x] No `.js`/`.jsx` source files remain.

## Comments

**2026-11-03 (agent):** Built on Vite 8.3, React 19.3, React Router 8.5 (single `react-router` package), Mantine 9.7, Vitest 5.1, Node 26.13. **TypeScript 6.0.3, not 7**: typescript-eslint (needed in US-1.4) only supports TypeScript below 6.1. The owner chose 6.0 + ESLint over 7 + oxlint (spec updated). `typecheck` is `tsc -b`, because the solution-style tsconfig (`tsconfig.app.json` for `src`, `tsconfig.node.json` for `vite.config.ts` + `scripts`) makes plain `tsc --noEmit` check nothing. Vitest has two projects, `app` (jsdom) and `scripts` (node); the US-1.5 `node:test` tests moved to Vitest. Verified: typecheck fails on an unchecked index access; 8 tests pass; build OK; `preview` serves the assets under `/recipe-app/`; dev server serves the page.
