# 05: Sharper thumbnails

Status: wontfix
Story: US-10.5

> **Not built (2026-11-08):** in the prototype (01) the owner kept 320px thumbnails at card size M. The 480px ones averaged about 82 KB each, 2–3× today's. The notes below stay in case it comes back.
Branch: `EPIC-10/US-10.5-thumbnails`
Spec: [../spec.md](../spec.md) (Cookbook)
Blocked by: 01 (only built if 480px wins; otherwise `wontfix`)

## What to build

- **Compressor:** raise the thumbnail variant in `src/utils/imageCompressor.ts` from `maxWidthOrHeight: 320, maxChars: 60_000` to 480px with a cap measured on the seed photos (likely about 120,000). It is still made from the compressed full image. Update the sizes in `docs/project/blueprint.md` and the CLAUDE.md "Planned layout" line.
- **Rules:** raise `recipe.thumbnail.size() <= 60000` (`firestore.rules:37`) to match, with rules tests for the new cap.
  - **Order matters:** the owner runs `npm run deploy:rules` after the rules change merges and **before** the app change ships. Otherwise saves with a new thumbnail fail on the live site.
  - Simplest: two PRs, rules first.
- **Regenerate thumbnails:** a one-off action on the Data page. It reads each recipe's full image (`recipe_images`), makes a new thumbnail and writes it to the recipe in batches.
  - Shows progress.
  - "Needs a connection" while the phone is offline, like Restore.
  - Recipes without a full image keep their thumbnail.
  - Needs a data URL → Blob step, because `compressImage` takes a `File`; `compressVariant` is private today.
  - All Firebase access stays in `src/data`.
- Check the size of the cookbook's first load before and after on the seed data, and note it in Comments. A thumbnail export to a backup file must still restore.

## Acceptance criteria

- [ ] Unit tests: the thumbnail variant is at most 480px and under its character cap.
- [ ] Rules tests: a thumbnail at the new cap passes; over it fails.
- [ ] Component test: Regenerate runs over fake recipes, skips ones without a full image, and is disabled offline.
- [ ] The owner has deployed the rules before the app change merges, and has run Regenerate on the live site afterwards (noted in Comments).
- [ ] `npm run check` and `npm run e2e` pass.

## Comments
