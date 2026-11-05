# 05: Playwright and the live sync test

Status: ready-for-agent
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

- [ ] `npm run e2e` passes locally on Windows and in CI.
- [ ] The test fails if live sync is broken (checked once, e.g. by swapping `onSnapshot` for a one-off read; don't commit that).
- [ ] The `check` job stays the single required check.

## Comments
