# 07: Install page

Status: needs-triage
Story: US-4.4
Branch: `EPIC-4/US-4.4-install-page`
Spec: [../spec.md](../spec.md) (Bookmarklet and import: Install page)
Blocked by: 04

## Touches

- `src/components/DataPage.tsx` (a new section), or a new component it renders (+ tests)

If you need to change anything else, stop and ask.

## What to build

A *Recipe bookmarklet* section on the Data page:

- a **draggable link** whose `href` is `bookmarkletHref(appUrl)` (04), with `appUrl` = `location.origin + location.pathname`, plus the text "Drag this to your bookmarks bar";
- the code in a read-only box with a **Copy** button;
- short steps for desktop Chrome, Firefox and Edge, iOS Safari (bookmark any page, then edit its URL to the code) and Android Chrome (run it by typing its name in the address bar);
- a note: "Safari (Mac and iPhone) can't run it on some sites. Use Paste recipe there."

React may block `javascript:` URLs in `href`. Check the current React docs and set the attribute in a way React allows (e.g. through a ref), with a test.

## Acceptance criteria

- [ ] Component tests: the link's `href` starts with `javascript:` and contains the app's address; Copy puts the code on the (faked) clipboard.
- [ ] By hand (owner): drag it to the bookmarks bar in desktop Chrome and run it on a recipe site (together with 06's check); install it on the phone by following the page's steps.

## Comments
