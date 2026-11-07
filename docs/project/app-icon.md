# App icon

The owner chose the icon on 2026-11-07 (EPIC-9, US-9.3). The files are in `public/` and are served at the base unchanged. They are committed exactly as approved: don't re-render or optimise them.

## Files

| File | Use |
|---|---|
| `icon.svg` | The master: 512×512, a full-bleed square, no text, no fonts. Gradients only, so every browser renders it the same. |
| `icon-512.png`, `icon-192.png` | Manifest icons. The 512 is also listed as `maskable` (see Safe zone). |
| `apple-touch-icon-180.png` | The iOS home screen (opaque, as iOS wants). iOS uses it ahead of manifest icons. |
| `favicon.svg` | The browser tab only. A flat, simplified version for 16–32px (see Favicon). |

## Design

- **Inspiration:** a Nordic cast-iron pot.
  - A black matte body.
  - A flat lid with a tight dome: a wide flat margin, then the rise. **No lid knob.**
  - A wavy oak carrying handle.
  - Straight steel arms, angled outwards from the pot wall and running past the handle. They have no hooks, which blurred at small sizes.
- **Background:** a dramatic dark forest-green radial gradient, `#25382f` → `#18251f` → `#0f1714`. It comes from the *Nordic Winter Cookbook* cover the owner used as the mood. The owner said **not** to lighten it. Contrast comes from the pot's lit left edge and the sheen on the rim instead.
- **Oak:** `#c39a6b`.
- The icon greens are darker than the app's own palette (brand green `#4f5d4a` in `src/theme.ts`) on purpose. The page `theme-color` uses the app's page background, not the icon green.

## Safe zone

Everything sits inside the maskable safe zone: the central circle, with a radius of 40% of the icon's width. One image can therefore be both `any` and `maskable`. iOS ignores `maskable`; it's there for Android, which is untested.

## Favicon

The full icon blurs into a dark square at 32px, so the tab uses its own SVG:

- The same shapes, flattened: a black pot body with a steel outline, a steel lid rim and arms, and the oak handle.
- The dark green `#18251f` square with rounded corners, and no gradients.
- Safari supports SVG favicons since Safari 26, so there's no PNG fallback.

## Rejected along the way

In order:

1. An "FR" monogram with "Family Recipes" in Cormorant. The text was unreadable at icon size.
2. A bowl, cutlery, a sprig, a wreath, and a joulutorttu Christmas star: "great but not satisfying".
3. A sprig on a plate with a napkin.
4. A cream pot.

Cutlery "might come back" as an idea, but the pot won.
