# 05: Playwright and the live sync test

Status: in-review
Story: US-5.5
Branch: `EPIC-5/US-5.5-playwright`
Spec: [../spec.md](../spec.md) (End-to-end tests)
Blocked by: 02

## Touches

- New: `playwright.config.ts`, `e2e/` (the test and any sign-in helper)
- `package.json` (dev dependency and an `e2e` script), `.github/workflows/ci.yml` (browser install and the e2e step in `check`)
- `.gitignore` (Playwright's report and results folders); `eslint.config.js` and `tsconfig*.json`, **only** as needed to cover `e2e/`
- `src/config/firebase.ts` or `src/data/auth.ts`, **only** for an emulator-only sign-in hook, if the emulator's popup can't be driven reliably

If you need to change anything else, stop and ask.

## What to build

- `@playwright/test` (verify the current version, config and CI docs). One project: Chromium at a phone-sized viewport. Playwright's `webServer` starts the Vite dev server with `VITE_USE_EMULATOR=true`; the npm script wraps the run in `firebase emulators:exec`.
- Sign in through the Auth emulator's fake Google popup, or an emulator-only hook if that's flaky (say which in the comments). Make the test user a member by writing `allowed_users` with admin access to the emulator, as the rules tests do.
- The test: two browser contexts on the same week. Add a note in the first; it appears in the second. Remove it in the second; it disappears from the first.
- CI: install Chromium with its system dependencies (Playwright's own command) and run the e2e step after the unit tests in the `check` job.

## Acceptance criteria

- [ ] `npm run e2e` passes locally on Windows (done) and in CI.
- [x] The test fails if live sync is broken (checked once, e.g. by swapping `onSnapshot` for a one-off read; don't commit that).
- [x] The `check` job stays the single required check.

## Comments

- 2026-11-05 (agent): Built on `EPIC-5/US-5.5-playwright`.
  - `@playwright/test` 1.65.0. `playwright.config.ts`: one project, `devices["Pixel 7"]` (Chromium); `webServer` runs `npx vite --port 5174 --strictPort` with the `.env.example` values in `env`, so CI needs no `.env` and a running `npm run dev` (5173) doesn't clash. CI: `forbidOnly`, 1 retry, list + HTML report. One worker.
  - **Sign-in:** the Auth emulator's own Google page is driven directly (`#add-account-button`, `#email-input`, `#display-name-input`, `#sign-in`); it always sets `email_verified: true`. No test-only hook in the app was needed. Two members (alice, bob) in two browser contexts; `allowed_users` is written through the Firestore emulator's REST API as the owner (`Authorization: Bearer owner`).
  - **The test** (`e2e/plan-live-sync.spec.ts`): Alice adds a note to today, Bob sees it, Bob removes it, Alice sees it go.
  - `npm run e2e` = `firebase emulators:exec --only auth,firestore "playwright test"`: fresh, empty emulators every run, so the dev data is never touched. **It can't run while `dev:all` is running** (same fixed ports).
  - **CI:** in the `check` job after the unit tests: `npx playwright install --with-deps chromium`, `npm run e2e`, and the HTML report uploaded (`actions/upload-artifact@v7`, latest release checked) on failure.
  - Locally on Windows: passes (8 s for the test, ~18 s in all). Sabotage check: `watchDays` swapped for a one-off `getDocs` → the test fails; reverted, not committed. `npm run check` passes (646 tests).
  - GitHub rejected every push for a while (`fatal error in commit_refs`, even for a branch at `main`); it went through on a later try with no changes.
