# 07: Install page

Status: ready-for-agent
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

- [x] Component tests: the link's `href` starts with `javascript:` and contains the app's address; Copy puts the code on the (faked) clipboard.
- [ ] By hand (owner): drag it to the bookmarks bar in desktop Chrome and run it on a recipe site (together with 06's check); install it on the phone by following the page's steps.

## Comments

**2026-11-04 (agent):** Built as `src/components/BookmarkletSection.tsx` (tests in `BookmarkletSection.test.tsx`), rendered last on the Data page. Nothing outside the Touches list changed.

- **React and `javascript:` URLs:** the React 19 upgrade guide only says "Error for javascript URLs in `src` and `href`". The installed react-dom 19.3.1 source (`sanitizeURL`) shows what that means: it replaces the value with `javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')`. So the link has **no `href` prop**, and a ref callback sets the attribute on the DOM node. The test checks that the href is exactly `bookmarkletHref(appUrl)` and doesn't contain "React has blocked". With the ref removed, the test failed with React's replacement URL, so it catches a regression.
- `appUrl` is `location.origin + location.pathname`. The code box is a read-only Mantine `Textarea`, and Copy uses Mantine's `CopyButton` (the label changes to "Copied"). The test reads the code back from user-event's fake clipboard.
- Steps for desktop Chrome/Firefox/Edge, iPhone (Safari) and Android (Chrome), plus the Safari note in the issue's wording.
- **Hand check (owner) still open:** drag the link to the bookmarks bar in desktop Chrome and run it on a recipe site (with 06), and install it on the phone by following the steps.
