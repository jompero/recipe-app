# 03: Data page spacing and wide column

Status: ready-for-agent
Story: US-10.3
Branch: `EPIC-10/US-10.3-data-page`
Spec: [../spec.md](../spec.md) (Data page)
Blocked by: 01

## What to build

**Prototype pick (01):** column plus dividers. `xl` gaps, a short centred `Divider` between sections (inset about 120px on wide screens, 40px on phones), and the page title as `order={1}` with `pt="xl"`.

- **All sizes:** more space between the five sections (install, Pepperplate import, export, restore, bookmarklet). A divider or larger gap, per 01. Also check the page's top padding and heading level: Data uses `Title order={2}` without `pt="xl"`, unlike other pages, so make it consistent.
- **Wide:** a centred column of about 720px. Headings stay centred; the theme's Title style is unchanged.

## Acceptance criteria

- [ ] Before and after screenshots at phone width and 1180 wide, attached to Comments.
- [ ] The iPad Playwright subset checks the Data page renders in its column.
- [ ] `npm run check` and `npm run e2e` pass.

## Comments
