# 03: Image compressor and images data module

Status: ready-for-agent
Story: US-2.3
Branch: `EPIC-2/US-2.3-image-compressor`
Spec: [../spec.md](../spec.md)
Blocked by: none

## What to build

- `src/utils/imageCompressor.ts` with `browser-image-compression`: a file goes in, two JPEG data URLs come out. The full image is ~1024px on the long side, aiming for ~100–150 KB; the thumbnail is ~320px, aiming for ~10–15 KB. Quality 0.75–0.8, lowered step by step if an image is over its cap (thumbnail ~40 KB, full ~900 KB, matching the rules in 04). No WebP (ADR-0001). Check the library's current API against its docs.
- `src/data/images.ts`: load and save the full image in `recipe_images/{id}`. This is the only image seam (ADR-0001). The thumbnail travels on the recipe document (04).
- Epic 4.3 later reuses this for camera and upload photos.

## Acceptance criteria

- [ ] Unit tests for the size-cap and quality step-down logic (with the library faked where jsdom has no canvas).
- [ ] Emulator test: save and load a full image.
- [ ] Checked by hand in the browser on a few real Pepperplate photos: sizes land in range, and the images look fine.

## Comments
