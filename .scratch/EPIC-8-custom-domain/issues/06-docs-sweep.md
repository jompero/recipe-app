# 06: Docs sweep and recovery note

Status: done
Story: US-8.6
Branch: `EPIC-8/progress-notes` (with the notes for 01–05)
Spec: [../spec.md](../spec.md) (If the domain lapses, The old address)
Blocked by: 05 (and any fix issues it creates)

## Touches

- `README.md` ("Live:" URL and "The live site")
- `docs/project/blueprint.md` (Security model: authorized domains and referrers)
- `docs/project/project-setup.md` (Phase 2: authorized domain, referrers, the custom domain steps)
- `CLAUDE.md` (Status: live address, Epic 8 done, next up Epic 9)
- `docs/backlog.md` (mark Epic 8 done)
- this spec's `Status:` line

Leave the `.scratch/EPIC-7-go-live/` notes as they are: they record what was true then.

## What to write

- Swap `https://jompero.github.io/recipe-app/` for `https://recipes.danijompero.com/` wherever the docs name the live site or its allowed origins. Keep the `firebaseapp.com` referrer.
- Add a short **"If the domain dies"** note to the README's live site section, from the spec: remove the custom domain in Pages settings, add `jompero.github.io` back to Firebase authorized domains and the key referrers, and mention that browsers may have cached the 301.
- Mention the permanent `_github-pages-challenge-jompero` TXT record, so nobody deletes it as clutter.

## Acceptance criteria

- [x] `grep -rn "jompero.github.io" README.md CLAUDE.md docs/` finds only the recovery note, the ADR history and the backlog's history.
- [x] `npm run check` passes (formatting).

## Comments

**2026-11-07 (agent):** Done. The live address and allowed origins are updated in README, blueprint, project-setup Phase 2 (with a custom domain step) and CLAUDE.md, and Epic 8 is marked done in the backlog. The README's live site section has the address, the permanent TXT record and an "If the domain dies" note. The remaining `jompero.github.io` mentions are the redirect, the recovery note, ADR history (0004, 0007) and the backlog's Epic 7 and 8 history.
