# 05: Security rules and tests

Status: ready-for-agent
Story: US-1.3
Branch: `EPIC-1/US-1.3-security-rules-tests`
Spec: [../spec.md](../spec.md)
Blocked by: 04

## What to build

- `firestore.rules` as in `docs/project/project-setup.md`: `isMember()` = signed in + `email_verified == true` + `allowed_users/{email}` exists. One explicit `match` each for `recipes`, `recipe_images`, `menu_days`. No `{document=**}` catch-all. `allowed_users/{email}`: read only when `request.auth.token.email == email`; write never.
- Membership only: no document-shape validation (later epics add it per collection).
- Rules tests with `@firebase/rules-unit-testing` in a separate Vitest project (node environment), run inside `firebase emulators:exec` locally and in CI.

## Test matrix

- {signed out, signed in with no allowlist doc, member with unverified email, member} × {read, write} on `recipes`, `recipe_images`, `menu_days`. Only the member is allowed.
- `allowed_users`: a user can read their own document, can't read someone else's, and nobody (members included) can create, update or delete.
- An unknown collection is denied for everyone, members included.

## Acceptance criteria

- [x] All matrix cases pass locally and in CI.
- [x] Removing the `email_verified` check, or adding a `{document=**}` catch-all, makes at least one test fail (check by hand, then revert).

## Comments

**2026-11-03 (agent):** `@firebase/rules-unit-testing` 6.0 (peer firebase ^13). The rules match `project-setup.md`, except `allowed_users` splits `read` into `get` (own entry only) and denies `list`, so nobody can enumerate the allowlist. 75 rules tests: 3 collections × (3 denied users × get/list/create/update/delete + member × the same 5), 9 `allowed_users` cases (including "a non-member can check their own missing entry", which US-1.6 relies on), and an unknown collection denied for signed-out, non-member and member. Mutation checks: removing `email_verified` fails the unverified-member tests; adding `{document=**}` fails 7 tests. The tests use their own project ID `demo-recipe-app-rules-test`, because `clearFirestore()` would otherwise wipe the developer's seeded data when run against `npm run emulators`. `singleProjectMode` is set to `false` so that second project doesn't log warnings. Third Vitest project `rules` (node env). `npm run check` now uses `test:ci`.
