# 03: Quality tooling and CI

Status: ready-for-agent
Story: US-1.4
Branch: `EPIC-1/US-1.4-quality-tooling-ci`
Spec: [../spec.md](../spec.md)
Blocked by: 02

## What to build

- **ESLint** (flat config, TypeScript + React rules) with `no-restricted-imports` banning `firebase` and `firebase/*` everywhere except `src/data/**` and `src/config/**`.
- **Prettier** with `endOfLine: "lf"`. ESLint and Prettier must not fight each other.
- **Husky + lint-staged:** the pre-commit hook runs only ESLint `--fix` and Prettier on staged files.
- **`npm run check`** runs typecheck, lint and tests.
- **CI** in `.github/workflows/ci.yml` on `pull_request` and `push` to `main`: checkout, setup Node from `.nvmrc` with npm cache, setup Java (Temurin 21, or whatever current firebase-tools requires), `npm ci`, typecheck, lint, tests inside `npx firebase emulators:exec --project demo-recipe-app --only auth,firestore`, build. No secrets. Look up the current major version of every action; don't copy them from `project-setup.md`. This step needs firebase-tools as a devDependency; add it here if US-1.2 hasn't yet.
- **Dependabot** (`.github/dependabot.yml`): weekly, `npm` and `github-actions`, each grouped into one PR.

## After merge (owner + agent)

Create a ruleset on `main`: require a pull request, require the CI check to pass, block force pushes and deletion, no required reviews, no bypass actors.

## Acceptance criteria

- [x] A file outside `src/data`/`src/config` importing `firebase/firestore` fails `npm run lint`.
- [x] Committing a badly formatted file gets it fixed by the hook.
- [x] The CI run on this PR is green.
- [x] The ruleset is active (`protect-main`, id 26412780: PR required, `check` required, no force push or deletion, no bypass; confirmed via the branch-rules API).
- [x] Dependabot config is valid (first "Dependabot Updates" runs started after merge).

## Comments

**2026-11-03 (agent):** Versions: ESLint 10.14 (flat config via `eslint/config`), typescript-eslint 8.72 with **type-aware** `recommendedTypeChecked`, react-hooks 7, react-refresh 0.5, Prettier 3.9 (+ eslint-config-prettier), Husky 9, lint-staged 17; actions `checkout@v7`, `setup-node@v7` (Node from `.nvmrc`). `npm run lint` = ESLint + `prettier --check` (Markdown excluded from Prettier so docs aren't reflowed). Emulator wrapper and Java setup in CI deferred to US-1.2 (no `firebase.json` yet); see issue 04. npm 11.20 blocks dependency install scripts by default; `re2` (only for the Hosting emulator) and `protobufjs` (only a version warning) are recorded as denied in `package.json` `allowScripts`. Verified: a `firebase/firestore` import in `src/components` fails lint and the same import in `src/data` passes.
