# 06: Sign-in shell

Status: ready-for-agent
Story: US-1.6
Branch: `EPIC-1/US-1.6-sign-in-shell`
Spec: [../spec.md](../spec.md)
Blocked by: 05

## What to build

- An auth module in `src/data` (the only place touching `firebase/auth`): sign in with Google via `signInWithPopup` (ADR-0003), sign out, observe the current user, and check membership by reading the user's own `allowed_users/{email}` document.
- Three UI states:
  - **Signed out:** app name + "Sign in with Google".
  - **Signed in, not a member:** "You're not on the list" + the signed-in email + sign-out.
  - **Member:** phone-first app shell with a header (name or avatar + sign-out) and an empty placeholder body for Epic 3.
- A loading state while auth and membership resolve, with no flash of the wrong screen.

## Acceptance criteria

- [x] Component tests cover all three states (plus loading), with the auth module faked at the `src/data` seam.
- [ ] **Manual, desktop:** with the emulator running and seeded, signing in as a seeded `@example.com` account shows the member shell; a different fake account shows "not on the list"; sign-out returns to the signed-out screen.
- [ ] **Manual, real phone over Wi-Fi:** the same flow works at `http://<pc-ip>:5173/recipe-app/`.
- [x] The Auth emulator's fake Google accounts have `email_verified: true`: hard-coded in firebase-tools 15.34 `lib/emulator/auth/widget_ui.js` (`createFakeClaims`).
- [x] Epic 1 wrap-up: update the "Status" section of `CLAUDE.md`.

## Comments

**2026-11-03 (agent):** `src/data/auth.ts` exposes `watchSession(onChange)` (session states `loading` / `signed-out` / `member` / `non-member` / `error`, ignoring stale membership answers after an account switch), `signIn()` (popup closed resolves quietly; popup blocked and other failures throw a message fit for the user, with `cause`) and `signOut()`. The membership check is `getDoc(allowed_users/{email})`, which the US-1.3 rules allow for your own entry. An `error` state ("Couldn't check your access") covers a failed membership read, e.g. offline with no cache. UI: `useSession` hook, `SessionScreens` (loading, sign-in, not on the list, access error), `MemberShell` (Mantine AppShell header: avatar, name hidden below `xs`, sign-out). 6 component tests fake `src/data/auth.ts` at the seam.
Note for later: Firebase grows the bundle to ~984 kB (300 kB gzip) and Vite prints its 500 kB chunk warning. Not acted on in Epic 1; worth revisiting (code-splitting, or service-worker caching in Epic 8).
Remaining: the owner's manual desktop and phone checks (these also close US-1.2's "app loads with the emulator connected").
