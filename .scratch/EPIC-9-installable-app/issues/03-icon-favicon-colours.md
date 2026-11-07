# 03: App icon, favicon and page colours

Status: ready-for-agent
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

- [ ] The owner approved the favicon preview. Record it under Comments.
- [ ] `npm run build`: the icons and favicon are in `dist/` and the links in `dist/index.html` are relative.
- [ ] The desktop browser tab shows the new favicon, and the colour matches the app's page background.
- [ ] `npm run check` passes.

## Comments
