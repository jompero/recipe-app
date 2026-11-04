# 06: Import route, photo fetch, duplicate notice

Status: needs-triage
Story: US-4.3
Branch: `EPIC-4/US-4.3-import-route`
Spec: [../spec.md](../spec.md) (Bookmarklet and import)
Blocked by: 03, 05 (and 01, through 05)

## Touches

- New: the import route component (+ tests); a small URL-matching module (+ tests)
- `src/routes.tsx`
- `src/App.tsx` or `src/main.tsx`, **only** to keep `d` in `sessionStorage` before the sign-in gate, if the route doesn't mount while signed out
- `src/components/EditPage.tsx` (photo fetch, duplicate notice)

If you need to change anything else, stop and ask.

## What to build

- **`#/import?d=…`:** `decodePayload` → `payloadToDraft` (03), then `navigate("/recipe/new", { replace: true, state: { draft, photoUrl } })`, so the long URL leaves history and reload or Back doesn't import again.
  - Signed out: `d` survives sign-in via `sessionStorage`.
  - Bad data: "Couldn't read that recipe", then the cookbook.
- **Photo fetch:** when the form gets a `photoUrl`, it tries `fetch` → Blob → the photo staging from 01. On failure it shows "Couldn't fetch the photo: copy the image on the site and paste it here", with a link that opens `photoUrl` in a new tab.
- **Duplicate notice:** whenever the form's source URL matches an existing recipe's (live recipes, archived included), show "You already have this recipe" with a link. It doesn't block saving. Compare ignoring protocol, `www.`, query, fragment and a trailing slash, using a small pure function with unit tests.

## Acceptance criteria

- [ ] Unit tests: URL matching.
- [ ] Component tests: a good `d` opens the filled-in form with the URL replaced; a bad `d` shows the error; signed out → sign in → the draft still opens; a failed photo fetch shows the fallback; a successful (faked) fetch stages the photo; the duplicate notice shows for a matching URL, including an archived recipe, and also for a Quick Paste draft whose source URL was typed.
- [ ] By hand (owner): bookmarklet → app on ~5 sites in desktop Chrome and Firefox; one site where the photo fetch works (e.g. BBC Good Food) and one where it doesn't.

## Comments
