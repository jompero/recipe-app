# 01: Prototype every page

Status: done
Story: US-10.1
Branch: `EPIC-10/US-10.1-prototypes` (**never merges**)
Spec: [../spec.md](../spec.md) (Prototypes)
Blocked by: none

## What to build

Throwaway routes at `#/proto/<page>?v=<variant>` that use the real theme, fonts and emulator seed data (`npm run dev:all`), behind the usual sign-in. Speed matters more than code quality here; nothing in this branch is reused as is. Add a small index page at `#/proto` linking every variant, and a floating switcher to flip `v` without editing the address.

Variants:
- **Shell:** the sticky top bar (links on the left in the Book style, current page underlined, page actions as buttons on the right) vs the menu button moved to the top right. Show both over a real page.
- **Cookbook:** the grid at 5–6 columns (cards about 200–240px) with wrapping tag chips and the A–Z list in columns. Thumbnails: today's 320px vs 480px made in the browser from each recipe's full image (`recipe_images`), switchable side by side.
- **Recipe:**
  - **A:** a full-width photo on top, then title and info, then sticky ingredients on the left and the method on the right.
  - **N ("Nordic Cookbook"):** a cropped photo on the left at about 38% of the width; on the right, the title and description centred above two columns, sticky ingredients and the method.

  Use a long and a short recipe from the seed data.
- **Plan month view:** a Monday-first month grid with ‹ month ›. Cells either show titles only (ellipsis, "+N more") or a tiny thumbnail plus title. Read-only is fine; no drag needed.
- **Roll:** the week grid (Mon–Sun columns, wrapping into week rows, out-of-range days greyed) with the bar above, using a fake roll.
- **Grocery list:** a centred column of about 560px. Amount after the name ("potatoes · 2 kg") vs amount first ("2 kg potatoes"). Also show the amount variants at phone width.
- **Data page:** a centred column of about 720px with centred headings and more space between sections.

## Acceptance criteria

- [x] Every variant renders on wide screens in desktop Chrome (the owner checked at 1552px).
- [x] The owner has picked a variant for every row. The picks are written under "Prototype picks" in the spec and into the affected issues (02–04, 06–09).
- [x] 320px thumbnails won, so 05 is set to `wontfix` with a note.
- [x] The prototype branch is pushed (for reference) but not merged.

## Comments

**2026-11-08 (agent):** Built and decided. The picks are in the spec ("Prototype picks").
- **Changed approach:** instead of `#/proto/*` routes, the variants were built on the real pages (the prototype skill's preferred approach), so they could be judged with live data and the real shell.
- **Prototype code** is on the never-merged branch `EPIC-10/US-10.1-prototypes`:
  - `src/prototype/`: the variant store, the floating bar, the 480px thumbnail maker and the month view
  - variant switches in `MemberShell`, `CookbookPage`, `RecipePage`, `PlanPage`, `RollPage`, `GroceryListPage` and `DataPage`

  Rewrite the layouts properly in the build issues; don't copy the prototype code as it is.
- **Thumbnails:** the 480px ones averaged about 82 KB each in the seed data.
- **Hooks:** the `--top-bar` CSS variable on the AppShell (the bar's height, 56px, or 0) worked well for every sticky element. Keep it in 02.
