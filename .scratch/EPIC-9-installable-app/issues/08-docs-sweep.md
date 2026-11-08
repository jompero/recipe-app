# 08: Docs sweep

Status: done
Story: US-9.8
Branch: `EPIC-9/progress-notes`
Spec: [../spec.md](../spec.md)
Blocked by: 07 (and any fix issues it created)

One docs PR at the end, as in Epic 8. It collects the per-issue notes.

## What to build

- **Issue files:** fill in each issue's Comments from what happened, tick the boxes, and set them to done. Add a "Different from the spec" list to the spec if anything changed.
- **CLAUDE.md:**
  - Status: Epic 9 built, in the style of the earlier epics (installable, service worker for the app's files only, offline strip, update banner, ADR-0009). Name what's next from the backlog.
  - Planned layout: add `public/` (icons) if that helps.
- **`docs/backlog.md`:** replace the Epic 9 draft with a done note and a link to the spec. Remove the three fixed smoke-test items (input zoom, opening on the menu, the Roll button) from the Epic 7 list; leave iPad/desktop layout.
- **README:**
  - How to install on a phone.
  - The service worker doesn't run on the LAN phone test (`http://<pc-ip>:5173/`, not a secure context). Test the installed app on the live site.
  - `npm run preview` is the way to see the service worker locally.
  - If the domain dies, an installed app must be reinstalled from the github.io address (its own origin).
- **Icon folder:** add `.scratch/pwa-icon/` to `.gitignore`. Remove that line from the local `.git/info/exclude`: it's local only, so do it in the working copy and say so in the PR body. The generator scripts stay out of the repo on every machine.

## Acceptance criteria

- [x] `npm run check` passes (Prettier on the markdown).
- [x] The PR body lists each Epic 9 issue with its result.

## Comments

**2026-11-08 (agent):** This PR.
- Issue notes filled in, and the spec set to done with "Different from the spec".
- CLAUDE.md status and layout updated.
- Backlog: the Epic 9 done note, and the three fixed smoke-test items removed.
- README: installed app notes.
- `.gitignore` now has `.scratch/pwa-icon/`, and the local `.git/info/exclude` line is removed (local only).
