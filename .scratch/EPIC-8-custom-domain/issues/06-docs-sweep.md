# 06: Docs sweep and recovery note

Status: ready-for-agent
Story: US-8.6
Branch: `EPIC-8/US-8.6-docs`
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

- [ ] `grep -rn "jompero.github.io" README.md CLAUDE.md docs/` finds only the recovery note, the ADR history and the backlog's history.
- [ ] `npm run check` passes (formatting).

## Comments
