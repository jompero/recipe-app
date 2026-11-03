# 03: Image compressor and images data module

Status: done
Story: US-2.3
Branch: `EPIC-2/US-2.3-image-compressor`
Spec: [../spec.md](../spec.md)
Blocked by: none

## What to build

- `src/utils/imageCompressor.ts` with `browser-image-compression`: a file goes in, two JPEG data URLs come out. The full image is ~1024px on the long side, aiming for ~100–300 KB; the thumbnail is ~320px, aiming for ~15–40 KB. Quality 0.75–0.8, lowered step by step if an image is over its cap (thumbnail ~60 KB, full ~900 KB, matching the rules in 04). No WebP (ADR-0001). Check the library's current API against its docs.
- `src/data/images.ts`: load and save the full image in `recipe_images/{id}`. This is the only image seam (ADR-0001). The thumbnail travels on the recipe document (04).
- Epic 4.3 later reuses this for camera and upload photos.

## Acceptance criteria

- [x] Unit tests for the size-cap and quality step-down logic (with the library faked where jsdom has no canvas).
- [x] Emulator test: save and load a full image.
- [x] Checked by hand in the browser on a few real Pepperplate photos: sizes land in range, and the images look fine.

## Comments

**2026-11-03 (agent):** Built `src/utils/imageCompressor.ts` (`compressImage(file)` → `{ full, thumbnail }` JPEG data URLs) and `src/data/images.ts` (`saveFullImage`, `loadFullImage`). `browser-image-compression` 2.0.2, checked against its shipped types and source:

- No `maxSizeMB`: with it set, the library also shrinks the resolution by 5% per pass. Instead `compressImage` tries quality 0.8, 0.7, 0.6, 0.5, 0.4 and keeps the first result whose data URL fits the cap. The caps are `FULL_IMAGE.maxChars = 900_000` and `THUMBNAIL.maxChars = 60_000` (raised from 40_000 on 2026-11-03, see below), measured on the data URL string, which is what the rules see. US-2.4's rules must allow at least these.
- The thumbnail is scaled from the compressed full image, not the original, which is much cheaper for big phone photos.
- The worker's `libURL` defaults to a jsdelivr CDN URL. It now points to a copy that Vite bundles (`?url` import), so the site makes no third-party requests.
- Emulator test: `src/data/images.emulator.test.ts`, in a new Vitest project `emulator` (`src/**/*.emulator.test.ts`, run by `npm run test:ci`). It mocks `src/config/firebase` with an emulator Firestore signed in as an allowlisted member, with the real rules loaded. US-2.4 can reuse the pattern.

Browser check (headless Edge, 8 real photos): the images look fine, orientation and aspect ratio are correct, small sources aren't upscaled, and each takes ~15–200 ms. **Sizes at quality 0.8 overshoot the targets:** full images are 118–245 KB (target 100–150) and thumbnails 14–30 KB (target 10–15). A run over all 181 photos found 12 thumbnails (no full images) over the 40K cap at quality 0.8. Eleven fit at 0.7 and one needed 0.6 (SkilletChickenCaesarSalad: 51.2K → 41.3K → 34.8K chars). Side by side, the stepped-down thumbnails look the same. A quality sweep shows the targets can't be met in the 0.75–0.8 range: the busiest photos still give ~135 KB full and ~20 KB thumbnail at quality 0.5. Left unchecked until the owner picks a fix: either accept the real sizes and update the targets in the spec and ADR-0001 (full images ~36 MB in total, still tiny next to the 1 GiB free tier), or start the thumbnail at a lower quality.

**2026-11-03 (agent):** The owner chose to raise the sizes rather than lower the quality. New targets: full ~100–300 KB and thumbnail ~15–40 KB. The thumbnail cap goes from 40_000 to 60_000 chars; the full cap stays at 900_000. Updated in the code, the spec, issue 04 (rules: thumbnail under ~60 KB), ADR-0001 (with a dated note), the blueprint and CLAUDE.md. With the new cap, every one of the 181 thumbnails fits at quality 0.8 (the largest is 51.2K chars), so the step-down is now only a safety net. The owner has seen the stepped-down examples and confirmed the images look good.
