# 06: Wrap-up docs

Status: ready-for-agent
Story: US-7.6
Branch: `EPIC-7/wrap-up`
Spec: [../spec.md](../spec.md) (Further Notes, Backups)
Blocked by: 05 and any fix issues it created

## Touches

- `CLAUDE.md` (Status; the "Local-first" rule)
- `docs/adr/0007-local-first-until-go-live.md` (a dated go-live note at the bottom; the decision itself stands)
- `README.md` (the live link; the backup habit; how to deploy rules)
- `docs/backlog.md` (Epic 7 done, Left for later)
- `docs/project/blueprint.md`, only if something in it is now wrong
- `.scratch/EPIC-7-go-live/spec.md` and the issues' `Status:` lines

If you need to change anything else, stop and ask.

## What to write

- `CLAUDE.md`:
  - Status: Epic 7 built; the site is live at `https://jompero.github.io/recipe-app/` on project `<project-id>` (`prod` alias); next up Epic 8.
  - "Local-first" becomes: local development, tests and e2e run only against the emulator (`demo-recipe-app`); never point the dev server at the live project; rules reach live only through `npm run deploy:rules`.
- ADR-0007: a note dated on the go-live day: the live project exists, local stays on the emulator, and what (if anything) showed up late, as the ADR predicted.
- README: the live link; "Backups: Data page → Export everything now and then, and keep the file outside the repo (Spark has no managed backups)"; "Changed the rules? `npm run deploy:rules`".
- Backlog, Epic 7: done, link to the spec, "Different from the spec", and Left for later: **Android untested** (nobody in the group has one), plus anything else from 02–05.

## Acceptance criteria

- [ ] The docs above agree with what was actually done (project ID, any console steps that differed, the smoke test result).
- [ ] No member email addresses anywhere in the repo.
- [ ] `npm run check` passes.

## Comments
