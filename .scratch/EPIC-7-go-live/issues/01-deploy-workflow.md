# 01: Deploy workflow, guard, rules script and checklist fixes

Status: ready-for-agent
Story: US-7.1
Branch: `EPIC-7/US-7.1-deploy-workflow`
Spec: [../spec.md](../spec.md) (Deploy workflow, Rules, The Firebase project, The API key)
Blocked by: none

## Touches

- New: `.github/workflows/deploy.yml`
- New: `.github/pull_request_template.md`
- `package.json` (a `deploy:rules` script)
- `docs/project/project-setup.md` (Phase 2 and the workflow listing)
- `.env.example` (the go-live comment only, if it disagrees with the spec)

If you need to change anything else, stop and ask. Don't touch `.firebaserc` yet: the `prod` alias is added in 02, once the real project ID exists.

## What to build

- `deploy.yml` as in the spec: push to `main` plus `workflow_dispatch`; checkout v7, setup-node v7 with `.nvmrc` and npm cache, `npm ci`, the guard, `npm run build` with the four `VITE_FIREBASE_*` values from `vars.FIREBASE_*` and `VITE_USE_EMULATOR: "false"`, configure-pages v6, upload-pages-artifact v5 (`dist`), then a `deploy` job with deploy-pages v5 in the `github-pages` environment. Permissions `contents: read`, `pages: write`, `id-token: write`; concurrency group `pages`, `cancel-in-progress: false`.
  - Check every action version against its releases page before writing it (CLAUDE.md: don't trust remembered versions). The spec's versions were current on 2026-11-06.
- The guard: a shell step that fails, naming the problem, if any of the four values is empty, `VITE_FIREBASE_PROJECT_ID` starts with `demo-`, or `VITE_USE_EMULATOR` is `true`.
- `npm run deploy:rules` → `firebase deploy --only firestore:rules --project prod`.
- PR template: a short summary section, and a checkbox "Changed `firestore.rules`? Run `npm run deploy:rules` after merging."
- `project-setup.md` Phase 2, rewritten to match the spec:
  - Standard edition, Production mode, `europe-west2`, can't be changed;
  - authorized domain `jompero.github.io`, and no localhost (not a default since Apr 2025, and not needed);
  - API key: referrers `https://jompero.github.io/*` and `https://<project-id>.firebaseapp.com/*` (no localhost), the API list to keep, restrict only after the first sign-in works, then test again;
  - rules with `npm run deploy:rules`;
  - members: the document ID is the Gmail address in lowercase;
  - data: export from the emulator, restore on live; Spark has no managed backups;
  - the workflow listing replaced by (or pointed at) the real `deploy.yml`;
  - the "What the original Gemini draft got wrong" table: fix its "Node 22" row if it no longer matches `.nvmrc`.

## Acceptance criteria

- [x] `deploy.yml` and the PR template exist; `npm run check` passes (826 tests).
- [x] Action versions checked against their releases pages, and noted in the PR.
- [ ] After merging, the first deploy run on `main` fails at the guard with its message (no variables yet). Record the run link under Comments.
- [x] Phase 2 of `project-setup.md` agrees with the spec, step for step.

## Comments

**2026-11-06 (agent):** Built. Latest releases via the GitHub API: checkout v7.0.1, setup-node v7.1.0, configure-pages v6.0.0, upload-pages-artifact v5.0.0, deploy-pages v5.0.1. The guard script was run locally: all four values empty → four errors, exit 1; a `demo-` ID with `VITE_USE_EMULATOR=true` → two errors, exit 1; a valid config → exit 0. The PR template uses the `/pr` skill's headings plus the rules checkbox. Phase 1 of `project-setup.md` still shows the original, older CI listing; left alone (out of scope). Left open: the first deploy run on `main` failing at the guard.
