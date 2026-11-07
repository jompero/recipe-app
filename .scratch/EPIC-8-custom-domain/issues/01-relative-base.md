# 01: Relative base, dev at `/`, ADR-0004 amendment

Status: done
Story: US-8.1
Branch: `EPIC-8/US-8.1-relative-base`
Spec: [../spec.md](../spec.md) (The base path)
Blocked by: none

## Touches

- `vite.config.ts` (`base` and its comment)
- `playwright.config.ts` (`BASE_URL`)
- `README.md` (the local URLs on the "Open http://localhost:5173/recipe-app/" line and the phone "Network" address line)
- `src/bookmarklet/bookmarklet.ts` (the doc comment example) and `src/bookmarklet/bookmarklet.test.ts` (`APP_URL`, for consistency)
- `docs/adr/0004-official-pages-actions-hashrouter.md` (a dated amendment)

If you need to change anything else, stop and ask. Don't touch the "Live:" URL in the README or any github.io reference in the docs; that's 06, after the switch.

## What to build

- `base: "./"`, with the comment explaining why: hash routing serves only `index.html`, so relative asset URLs work at `jompero.github.io/recipe-app/` and `recipes.danijompero.com/` alike (ADR-0004).
- Dev and e2e at `/`: `BASE_URL = http://localhost:${PORT}/`. Check that Vite's dev server serves the app at `/` with `base: "./"`. If it doesn't, stop and report before working around it.
- Add an ADR-0004 amendment in the same style as the 2026-11-04 update. Base is relative (`./`) and no longer the repo name, to allow the custom domain (EPIC-8) with no downtime. Hash routing and the official actions stand.

## Acceptance criteria

- [x] `npm run check` and `npm run e2e` pass.
- [x] `npm run build`: `dist/index.html` references `./assets/...`, not `/recipe-app/` or `/assets/`. Fonts and other assets in the built CSS resolve (no absolute `/recipe-app/` paths left in `dist/`).
- [x] `npm run preview` loads with styles and fonts, and a deep link (`#/plan`) works on refresh.
- [x] After merging: the deploy run is green, and `https://jompero.github.io/recipe-app/` still loads with styles, fonts and sign-in. Record the run link under Comments.

## Comments

**2026-11-07 (agent):** Built. `npm run check` passes (826 tests), and `npm run e2e` passes (2) with the dev server at `/`, so `base: "./"` works in dev. `dist/index.html` references `./assets/...`, the CSS loads fonts as `url(./…woff2)`, and `dist/` has no absolute `/recipe-app/` or `/assets/` paths. Instead of `npm run preview`, a static server served `dist/` both under `/recipe-app/` (as github.io does) and at `/` (as the custom domain will): the page, JS, CSS and a font all return 200 in both. Deep links are hash routes, so only `index.html` is ever requested. Left open: the deploy check after merging.

**2026-11-07:** Merged in PR #57. The owner confirmed the deploy run was green and the github.io site still loads with styles, fonts and sign-in.
