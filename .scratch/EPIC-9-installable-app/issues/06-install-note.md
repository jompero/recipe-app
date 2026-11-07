# 06: "Install on your phone" note

Status: ready-for-agent
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

- [ ] Component test: the section shows in a browser tab and is hidden in standalone mode (both checks faked).
- [ ] `npm run check` passes.

## Comments
