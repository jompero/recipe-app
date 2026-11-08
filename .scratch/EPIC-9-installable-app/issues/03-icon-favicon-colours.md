# 03: App icon, favicon and page colours

Status: done
Story: US-9.3
Branch: `EPIC-9/US-9.3-icons`
Spec: [../spec.md](../spec.md) (Icon, favicon and colours)
Blocked by: none

## What to build

- **Icon files:** copy the approved images from `.scratch/pwa-icon/` into Vite's `public/` folder (create it), unchanged: `icon.svg`, `icon-512.png`, `icon-192.png`, `apple-touch-icon-180.png`. Don't re-render or optimise them. Leave the generator scripts and previews out.
- **Design notes:** a short `docs/project/app-icon.md` from the folder's README: the design, colours, safe zone (one image for `any` and `maskable`), and rejected options. Leave out the script instructions.
- **Favicon:** draw a new, simple SVG favicon: flat black pot and oak handle (`#c39a6b`) on the dark green (`#18251f`), the same shapes as the icon, no gradients, readable at 16 and 32 px. Add a PNG fallback only if current docs show a browser in use (desktop Safari) needs one. Render a preview (16, 32 and 64 px side by side, light and dark browser tab) to the scratchpad for the owner.
- **Head tags** in `index.html`, all paths relative (the base is `./`):
  - the favicon link
  - `apple-touch-icon` pointing at the 180 px PNG
  - `theme-color` set to the app's page background (find it in the theme or Mantine's defaults), replacing the leftover orange `#fd7e14`.
- Check the 512 px icon against the maskable safe zone (the central circle, 40% radius; `preview.png` shows it). Record the result under Comments; 04 relies on it.

## Acceptance criteria

- [x] The owner approved the favicon preview. Record it under Comments.
- [x] `npm run build`: the icons and favicon are in `dist/` and the links in `dist/index.html` are relative.
- [x] The desktop browser tab shows the new favicon, and the colour matches the app's page background.
- [x] `npm run check` passes.

## Comments

**2026-11-07 (agent):** Merged in PR #60.
- The four approved files are in `public/` and byte-identical to `.scratch/pwa-icon/`. Design notes are in `docs/project/app-icon.md`.
- **Favicon:** a new flat `favicon.svg` with steel edges, because a flat black pot disappears on the dark green. The owner approved it from a 16/32/64 px preview on light and dark tabs. No PNG fallback: Safari supports SVG favicons since Safari 26 (WebKit, WWDC25; caniuse).
- `theme-color` is `#ffffff`, Mantine's light body colour, replacing the orange. Vite turns the head links into relative paths (`./favicon.svg`).
- **Safe zone:** checked from the SVG coordinates. The furthest drawn point (the shadow's edge) is about 194 px from the centre, inside the 205 px circle, so the 512 serves as `maskable`.
