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

- [ ] Component tests cover all three states (plus loading), with the auth module faked at the `src/data` seam.
- [ ] **Manual, desktop:** with the emulator running and seeded, signing in as a seeded `@example.com` account shows the member shell; a different fake account shows "not on the list"; sign-out returns to the signed-out screen.
- [ ] **Manual, real phone over Wi-Fi:** the same flow works at `http://<pc-ip>:5173/recipe-app/`.
- [ ] Check (against current docs or by trying it) that the Auth emulator's fake Google accounts have `email_verified: true`; note the result here.
- [ ] Epic 1 wrap-up: update the "Status" section of `CLAUDE.md`.

## Comments
