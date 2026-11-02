# Recipe images are stored in Firestore, not Firebase Storage

Since 3 Feb 2026, Cloud Storage for Firebase needs the Blaze (pay-as-you-go) plan, so the original Gemini blueprint's "completely free" Storage design no longer works. To stay on the Spark plan with no card attached, we store compressed images as base64 inside Firestore documents. Each recipe has a thumbnail of about 320 px and 10–15 KB, embedded in the recipe document so the grid needs no extra reads. The full photo, about 1024 px and 100–150 KB, has its own document in `recipe_images/{recipeId}` and loads only in the detail view.

## Considered Options

- **Blaze plan plus Firebase Storage:** the cleaner design, but it needs a card, and budget alerts only notify; they don't cap spending.
- **Cloudflare R2 or Cloudinary:** a second service. R2 also needs a card, and a Worker (a server) to handle uploads, which goes against "no server".

## Consequences

- Images are JPEG at quality 0.75–0.8, not WebP, because Safari/iOS has historically been unable to produce WebP from a canvas and quietly outputs a much larger PNG. There's a size check against the 1 MiB document limit.
- All image access goes through `src/data/images.ts`, so moving to Firebase Storage on Blaze later means one migration script plus changes to that module only.
