# 01: Save the Pepperplate images

Status: ready-for-agent
Story: US-1.5
Branch: `EPIC-1/US-1.5-save-pepperplate-images`
Spec: [../spec.md](../spec.md)

Do this first. The links work as of 2026-11-02, but they're on a dead product's CDN.

## What to build

A dependency-free TypeScript script, run directly by Node 26, that downloads the image linked on each recipe's `Image:` line in `docs/pepperplate-data/pepperplate_recipes/*.txt` into gitignored `.scratch/pepperplate-images/`. It only reads `docs/pepperplate-data/` and never writes there.

- Save the bytes exactly as downloaded, with no resizing or compression. Name each file `<recipe .txt stem>.jpg`.
- Follow redirects (`cdn2.pepperplate.com` 302s to `pepperplate.blob.core.windows.net`, served as `application/octet-stream`, about 1.8 MB each).
- Check the JPEG magic bytes (`FF D8 FF`). Anything else is `failed`.
- Low concurrency (about 4) with a few retries and backoff.
- Safe to re-run: files already saved are `skipped-existing`.
- Write `manifest.json` with one entry per recipe: recipe file, original URL, saved file, status (`saved` / `skipped-existing` / `no-image` / `failed`) and a reason on failure. Print a summary of the counts.
- Recipes with no `Image:` URL are `no-image`, not failures.

## Acceptance criteria

- [x] A real run ends with 181 images `saved` or `skipped-existing`, 17 `no-image` and 0 `failed` (or the failures are explained).
- [x] Every saved file opens as a JPEG.
- [x] A second run downloads nothing and reports everything as `skipped-existing` / `no-image`.
- [x] `git status` shows no files from `docs/pepperplate-data/` or `.scratch/pepperplate-images/`.
- [x] Unit tests cover `Image:` line parsing and filename derivation. (Until US-1.1 adds Vitest, they can use `node:test`; they move to Vitest once it exists.)
- [x] **Manual (owner):** copy `docs/pepperplate-data/` and `.scratch/pepperplate-images/` to a personal cloud drive.

## Comments

**2026-11-02 (agent):** Script at `scripts/download-pepperplate-images.ts` (helpers + `node:test` tests in `scripts/pepperplate-images/`). Real run on Node 26.13: 181 saved, 17 no-image, 0 failed; 52 MB total; all 181 verified as JPEG. Re-run: 181 skipped-existing. Tests: `node --test scripts/pepperplate-images/lib.test.ts` (7 pass). Remaining: the owner's manual cloud backup.
