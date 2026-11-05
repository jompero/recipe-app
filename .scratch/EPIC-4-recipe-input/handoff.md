# EPIC-4 handoff (2026-11-05)

For the agent that finishes Epic 4. Read `CLAUDE.md`, then [spec.md](spec.md), then this file.

## How we work now

- **One issue at a time, in the main checkout** (`C:\Users\danij\Documents\Other Projects\recipe-app`). No worktrees and no parallel agents. The other worktrees have been removed. `../recipe-app-prototype` is Epic 3's design reference: leave it alone.
- For each issue:
  - create a branch from `origin/main` named as in the issue (`EPIC-4/US-4.x-…`);
  - work test-first;
  - run `npm run check` (it starts the emulator on ports 8080/9099, so ask the owner to stop `dev:all` first if it's running);
  - when done, tick the acceptance criteria and add a dated comment to the issue;
  - commit with `EPIC-4/US-4.x` in the message, push, and open a PR to `main`.
- **Stop after each PR.** The owner reviews, merges and does the by-hand checks before you start the next issue.
- Stay within each issue's **Touches** list. If you need anything outside it, ask first.
- Verify Firebase, React, Vite and GitHub APIs against current docs (see `CLAUDE.md`).

## Where things stand

Merged on `main`: issues 01 (photo), 02 (paste splitter), 03 (`ld+json` converter and codec), 04 (bookmarklet script), 05 (paste page and the `NewRecipeState` seam), 06 (import route, photo fetch, duplicate notice; by-hand checks passed) and 07 (install section on the Data page). **Each issue's Comments section says what was actually built and the choices made beyond the spec.** Read the comments on the issues the next one depends on before writing code.

The current branch, `EPIC-4/US-4.3-import-route`, already has one docs commit (05 and 07 marked done, the owner's notes, 06 marked ready, this file and a note in the spec). Keep it; it goes into 06's PR.

## Next, in order

1. **[06 Import route, photo fetch, duplicate notice](issues/06-import-route.md)** (US-4.3), on the current branch.
   - It joins the pieces: the bookmarklet's `#/import?d=` link (04), `decodePayload` and `payloadToDraft` (03), `NewRecipeState` with `clearOnSave` in `src/editing/recipeForm.ts` (05), and `usePhotoDraft().stage(blob)` from `src/components/usePhotoDraft.ts` (01).
   - The bookmarklet currently ends in an error on any recipe page, because this route doesn't exist yet. The owner has seen that.
2. **[08 Microdata fallback in the bookmarklet](issues/08-microdata-fallback.md)** (US-4.4), on a new branch `EPIC-4/US-4.4-microdata-fallback`.
   - Valdemarsro, the owner's main source, keeps its recipe in schema.org microdata, not `ld+json`. The issue describes the page's markup.
   - Keep the bookmarklet functions self-contained (see the comment on issue 04).
3. **Owner's by-hand session** after 06 and 08 are merged. Prepare a short checklist for the owner:
   - the bookmarklet in desktop Chrome and Firefox on about 5 sites, including two Valdemarsro recipes;
   - one photo fetch that works (BBC Good Food) and one that falls back to copy and paste;
   - the duplicate notice;
   - installing the bookmarklet on the phone from the Data page's steps.
   Record the results in the issues' comments.
4. **Wrap-up: talk it through with the owner before doing it.**
   - [09 Largest site photo](issues/09-largest-photo.md) is `needs-triage`: ask whether to build it now or leave it in the backlog.
   - **Quick Paste testing:** the owner found that the filled-in form didn't always match what they intuitively expected (see the comment on issue 05). Ask the owner for real samples and the result they expect from each, then decide together: test cases, rule changes, or a follow-up issue.
   - Then update `docs/backlog.md` (Epic 4 done, plus anything moved to later), the Status section of `CLAUDE.md` (Epic 4 built; next up, Epic 5, starting by turning its backlog draft into a spec), and the issue statuses. Check that ADR-0001 has the photo-deletion note (added in 01).

## Things to know

- The owner mostly uses the bookmarklet on a PC. Phones and Safari are best effort.
- No server or proxy of any kind (Spark plan, `CLAUDE.md`). A site photo that can't be fetched because of CORS falls back to the owner copying and pasting the image. That fallback is the intended design, not a bug to work around.
- The payload format (`src/import/recipePayload.ts`) is shared by the bookmarklet and the converter. Changing it means changing both.
