# 06: "Install on your phone" note

Status: done
Story: US-9.6
Branch: `EPIC-9/US-9.6-install-note`
Spec: [../spec.md](../spec.md) (Install note)
Blocked by: 04 (the app must be installable before the note tells people to install it)

## What to build

- A short "Install on your phone" section on the Data page, in the same style as the bookmarklet section:
  1. In Safari or Chrome, tap Share → Add to Home Screen. Keep "Open as Web App" on.
  2. Open Recipes from your home screen.
  3. Sign in once more: the installed app keeps its own sign-in.
- Hidden when running as an installed app: `matchMedia('(display-mode: standalone)')`, with iOS's `navigator.standalone` as a fallback. Check both against current docs.
- The owner can copy the same text to send to members (no extra feature needed).

## Acceptance criteria

- [x] Component test: the section shows in a browser tab and is hidden in standalone mode (both checks faked).
- [x] `npm run check` passes.

## Comments

**2026-11-07 (agent):** Merged in PR #63.
- The section is at the top of the Data page, which is where a phone user lands; the Pepperplate import below it is desktop work.
- It's hidden when `matchMedia('(display-mode: standalone)')` matches, or when `navigator.standalone` is true.
- Tests cover a browser tab and both standalone checks.

**2026-11-08:** In the smoke test (07), the note showed in Safari and was gone in the installed app.
