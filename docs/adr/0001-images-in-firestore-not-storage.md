# Recipe images are stored in Firestore, not Firebase Storage

Since 3 Feb 2026, Cloud Storage for Firebase needs the Blaze (pay-as-you-go) plan, so the original Gemini blueprint's "completely free" Storage design no longer works. To stay on the Spark plan with no card attached, we store compressed images as base64 inside Firestore documents. Each recipe has a thumbnail of about 320 px and 15–40 KB, embedded in the recipe document so the grid needs no extra reads. The full photo, about 1024 px and 100–300 KB, has its own document in `recipe_images/{recipeId}` and loads only in the detail view.

## Considered Options

- **Blaze plan plus Firebase Storage:** the cleaner design, but it needs a card, and budget alerts only notify; they don't cap spending.
- **Cloudflare R2 or Cloudinary:** a second service. R2 also needs a card, and a Worker (a server) to handle uploads, which goes against "no server".

## Consequences

- Images are JPEG at quality 0.75–0.8, not WebP, because Safari/iOS has historically been unable to produce WebP from a canvas and quietly outputs a much larger PNG. There's a size check against the 1 MiB document limit.
- All image access goes through `src/data/images.ts`, so moving to Firebase Storage on Blaze later means one migration script plus changes to that module only.
- Size targets were revised on 2026-11-03 (US-2.3). The first estimates (thumbnail 10–15 KB, full 100–150 KB) can't be reached at quality 0.75–0.8: on the 181 Pepperplate photos, detailed photos give ~30 KB thumbnails and up to ~275 KB full images. We kept the quality and raised the targets. The thumbnail cap went from ~40 KB to ~60 KB so almost no thumbnail has to drop quality. Storage stays under ~100 MB of the 1 GiB free tier.
- Since Epic 4 (US-4.1), removing a recipe's photo deletes its `recipe_images` document (and sets `thumbnail: null`, `hasImage: false` on the recipe), so the rules let members delete `recipe_images`. Recipes themselves are still never deleted, only archived.
