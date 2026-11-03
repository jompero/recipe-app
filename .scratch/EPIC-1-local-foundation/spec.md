# EPIC-1: Local Foundation

Status: ready-for-agent

Replaces the Epic 1 placeholder in `docs/backlog.md`. Settled in a grilling session on 2026-11-02.

## Problem Statement

The repo holds only docs and empty placeholder files: nothing builds, nothing is tested, and nothing is enforced. The 181 recipe images linked from the Pepperplate export live on a dead product's CDN and could disappear any day. Before any feature work (Epic 2 onwards) there has to be a local setup where the app runs against the Firebase Emulator, the security rules are proven by tests, and every change to `main` is checked automatically.

## Solution

- Rescue the Pepperplate images first, before anything else.
- Scaffold a phone-first React + TypeScript + Vite + Mantine app with HashRouter.
- Put quality tooling and CI in place early, so every later PR is gated by it.
- Run Firebase Auth and Firestore locally in the Emulator (`demo-recipe-app`) with an offline cache and data that survives restarts.
- Write the Firestore rules (allowlist plus `email_verified`, an explicit rule per collection) and prove them with a full test matrix.
- Finish with a sign-in shell: Google popup sign-in (fake accounts in the emulator), a "not on the list" screen, and an empty member home.

## Build order

The story IDs keep their original numbers. The build order is:

1. **US-1.5** Save the Pepperplate images (urgent, standalone)
2. **US-1.1** Project scaffold
3. **US-1.4** Quality tooling and CI, followed by the `main` ruleset
4. **US-1.2** Firebase Emulator
5. **US-1.3** Security rules and tests (rules tests join CI here)
6. **US-1.6** Sign-in shell

One issue file per story is in `issues/`.

## Prerequisites (before US-1.5)

- **Initial commit** directly on `main`. This is the only commit not made through a feature branch. Before it:
  - Set the repo-local git email to the user's GitHub noreply address (not the personal Gmail). The user also turns on GitHub's "Block command line pushes that expose my email".
  - Delete the 9 empty placeholder files (`package.json`, `vite.config.js`, `.github/workflows/deploy.yml`, everything under `src/`).
  - Add `.gitattributes` with `* text=auto eol=lf`.
  - Add the MIT licence of `mattpocock/skills` next to the committed `.claude/skills/`.
  - Check that no real emails, keys or Pepperplate data are staged.
- **Toolchain:** Node 26 LTS ("Lithium", the Active LTS line since Oct 2026, replacing the installed, end-of-life Node 20) and Temurin JDK 21, both installed with winget. Install the GitHub CLI (`gh`) with winget; the user runs `gh auth login` once.
- **GitHub repo:** public, named `recipe-app` (it must match Vite `base`), created with `gh`. Pages stays off until Epic 7.

## User Stories

1. As the owner, I want every Pepperplate image saved locally before the CDN dies, so that the seed recipes keep their photos.
2. As the owner, I want the saved images named after their recipe file, so that the importer (Epic 2) can match them automatically.
3. As the owner, I want a manifest of what was downloaded, skipped or failed, so that I know whether the rescue is complete.
4. As the owner, I want the download script to be safe to re-run, so that a partial run can be resumed without downloading everything again.
5. As the owner, I want the script to reject files that aren't real JPEGs, so that an HTML error page never passes as an image.
6. As the owner, I want the original export and the saved images backed up off this laptop, so that a dead laptop doesn't lose the seed data.
7. As a developer, I want `npm run dev` to start a phone-first Mantine app, so that I can start building screens.
8. As a developer, I want routing through HashRouter with Vite `base` set to `/recipe-app/`, so that the build already works under GitHub Pages.
9. As a developer, I want a minimal theme in one place, so that the real visual design in Epic 3 changes one file.
10. As a developer, I want a README that takes a fresh clone to a running app, so that setup doesn't depend on memory.
11. As a developer, I want ESLint and Prettier to run on staged files before every commit, so that formatting and obvious mistakes never reach a PR.
12. As a developer, I want lint to fail if anything outside `src/data` or `src/config` imports Firebase, so that the data boundary holds from day one.
13. As a developer, I want strict TypeScript with `noUncheckedIndexedAccess`, so that index and undefined mistakes are caught at compile time.
14. As a developer, I want CI on every PR to run typecheck, lint, all tests against the emulator, and the build, so that `main` is always green.
15. As a developer, I want `main` protected so that it can only change through a PR with passing CI, with no bypass, so that the rule can't be skipped in a hurry.
16. As a developer, I want Dependabot to propose weekly grouped updates for npm and GitHub Actions, so that versions stay current without anyone remembering them.
17. As a developer, I want the Auth and Firestore emulators to start with one command and keep their data between restarts, so that local data isn't lost.
18. As a developer, I want the app to connect to the emulator whenever `VITE_USE_EMULATOR=true`, using the page's own hostname, so that a phone on the same Wi-Fi works too.
19. As a developer, I want the Firestore offline cache on in every mode, so that I test what ships (Epic 8 builds on it).
20. As a developer, I want `npm run seed` to put fake allowlist entries into the emulator, so that a fresh clone or wiped emulator is one command from a usable app.
21. As the owner, I want the rules to deny everything unless the user has a verified email and an `allowed_users` document, so that strangers who sign in get nothing.
22. As the owner, I want members unable to write to `allowed_users`, so that nobody can add themselves or others.
23. As a developer, I want every rule proven by automated tests in CI, so that a rules change can't silently open the database.
24. As a user, I want to sign in with Google in a popup, so that there's no password to manage.
25. As a signed-in non-member, I want a clear "you're not on the list" screen showing my email, with sign-out, so that I know why I see nothing and can switch accounts.
26. As a member, I want a phone-first app shell with my name or avatar and sign-out, so that I know I'm in.
27. As a developer, I want to check the app on my real phone over Wi-Fi with emulator sign-in, so that phone layout and the popup are checked early.

## Implementation Decisions

- **Image rescue script** is a dependency-free TypeScript script run directly by Node 26 (built-in `fetch`, native type stripping). It only reads `docs/pepperplate-data/` and writes to gitignored `.scratch/pepperplate-images/`. It saves the bytes exactly as downloaded (no resizing or compression, which happens in the Epic 2 importer), names each file `<recipe .txt stem>.jpg`, and writes `manifest.json` (recipe file, original URL, saved file, status: `saved` / `skipped-existing` / `no-image` / `failed` + reason). It follows redirects (the CDN 302s to an Azure blob served as `application/octet-stream`), checks the JPEG magic bytes, uses low concurrency with retries, and skips files already saved. Recipes with no `Image:` line (17 of 198) are `no-image`, not failures. The script is committed, the images never are.
- **Scaffold:** Vite + React + TypeScript + Mantine, React Router's `HashRouter`, Vite `base: "/recipe-app/"`. A minimal Mantine theme (primary colour, font, radius) in a single theme module. Phone-first layout. English UI. npm as the package manager. Node version pinned in `.nvmrc` and `package.json` `engines`; CI reads `.nvmrc`.
- **Quality tooling:**
  - ESLint (flat config) with a `no-restricted-imports` rule banning `firebase` and `firebase/*` except in `src/data/**` and `src/config/**`.
  - Prettier with `endOfLine: "lf"`.
  - Husky + lint-staged pre-commit runs only ESLint `--fix` and Prettier on staged files.
  - `npm run check` runs typecheck, lint and tests locally.
  - TypeScript **6.0.x** (not 7: typescript-eslint supports only TypeScript below 6.1 as of Nov 2026; Dependabot ignores TypeScript major updates until it supports 7; decided 2026-11-03), `strict` + `noUncheckedIndexedAccess`; `typecheck` (`tsc -b`, which checks every project in the solution-style tsconfig without emitting) is its own script and CI step, separate from `build`.
- **CI** (`.github/workflows/ci.yml`) on pull requests and pushes to `main`: install, typecheck, lint, tests inside `firebase emulators:exec` (auth + firestore), build. No secrets. Action versions and the firebase-tools Java requirement are checked against current docs when written, not copied from `project-setup.md`.
- **Ruleset on `main`**, created right after the CI PR merges: require a pull request, require the CI check to pass, block force pushes and deletion, no required reviews (solo developer), no bypass actors.
- **Dependabot:** weekly, ecosystems `npm` and `github-actions`, each grouped into one PR.
- **Emulator:** `firebase.json` with Auth (9099) and Firestore (8080) bound to `0.0.0.0` plus the Emulator UI; project `demo-recipe-app`; an npm script starts it with `--import=.emulator-data --export-on-exit`. firebase-tools is a devDependency used through `npx`.
- **Firebase config module:** initialises the app from `import.meta.env.VITE_FIREBASE_*`, Firestore with `persistentLocalCache` + `persistentMultipleTabManager` in every mode, and connects both emulators to `window.location.hostname` when `VITE_USE_EMULATOR=true`. Only `src/data/*` imports it.
- **Seed script:** `npm run seed` writes `allowed_users` documents for fake `@example.com` addresses into the emulator, bypassing rules. Safe to re-run. Never contains real emails.
- **Rules:** as in `project-setup.md`: `isMember()` = signed in + `email_verified == true` + `allowed_users/{email}` exists; one explicit `match` per collection (`recipes`, `recipe_images`, `menu_days`), no `{document=**}` catch-all; `allowed_users` readable only by the matching email, never writable. Membership only: no document-shape validation in Epic 1. Each later epic adds validation for its own collection once its schema is final.
- **Sign-in shell:** an auth module in `src/data` exposes sign-in (Google, `signInWithPopup`), sign-out, the current user, and membership (read of the user's own `allowed_users/{email}`). The UI has three states: signed out (app name + "Sign in with Google"), signed-in non-member ("not on the list" + email + sign-out), member (app shell header with name or avatar + sign-out, empty placeholder body).

## Testing Decisions

- Good tests check behaviour seen from outside (what a user sees, what the rules allow), not implementation details.
- **Vitest for everything**, split into projects: unit/component tests (jsdom + React Testing Library) and rules tests (`@firebase/rules-unit-testing`, node environment). All run under `firebase emulators:exec` in CI.
- **Rules test matrix:** {signed out, signed in without an allowlist doc, unverified email, member} × {read, write} on each of `recipes`, `recipe_images`, `menu_days`. Plus `allowed_users`: a user can read only their own document, nobody can write (members included). Plus an unknown collection, which is denied for everyone.
- **Sign-in shell:** component tests for the three states, with the auth module faked at the `src/data` seam. Popup sign-in is checked by hand against the emulator (desktop and real phone), not automated.
- **Image script:** filename derivation and `Image:` line parsing are unit tested; the download itself is verified by the manifest summary on a real run.
- No end-to-end browser tests (revisit around Epic 3). No coverage threshold.
- No prior art yet: these tests set the patterns later epics follow.

## Out of Scope

- Any real Firebase project, rules deployment, API key restriction, GitHub Pages deploy or `deploy.yml` (Epic 7, ADR-0007).
- Document-shape validation in rules (added per epic).
- Recipe parsing, importing or image compression (Epic 2).
- Real visual design beyond a minimal theme (Epic 3).
- PWA manifest and service worker (Epic 8).
- End-to-end browser tests.

## Further Notes

- **Offline cache gotcha:** after wiping or resetting the emulator, the browser still shows old documents from IndexedDB until site data is cleared. Document this in the README.
- **Phone testing** needs Windows Firewall inbound rules for ports 5173, 9099 and 8080 on private networks. Document this in the README.
- When Epic 1 is done, update the "Status" section of `CLAUDE.md`.
