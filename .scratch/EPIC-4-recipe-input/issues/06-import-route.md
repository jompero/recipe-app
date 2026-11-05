# 06: Import route, photo fetch, duplicate notice

Status: ready-for-agent
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

- [x] Unit tests: URL matching.
- [x] Component tests: a good `d` opens the filled-in form with the URL replaced; a bad `d` shows the error; signed out → sign in → the draft still opens; a failed photo fetch shows the fallback; a successful (faked) fetch stages the photo; the duplicate notice shows for a matching URL, including an archived recipe, and also for a Quick Paste draft whose source URL was typed.
- [ ] By hand (owner): bookmarklet → app on ~5 sites in desktop Chrome and Firefox; one site where the photo fetch works (e.g. BBC Good Food) and one where it doesn't.

## Comments

- 2026-11-05 (agent): Built on `EPIC-4/US-4.3-import-route`. **Route:** `src/components/ImportPage.tsx` at `#/import`. It reads `d` once, runs `decodePayload` → `payloadToDraft` and opens the form with `NewRecipeState` (`{ draft, photoUrl? }`). **Choice beyond the issue: history.** A plain `replace` to `/recipe/new` left the form as the first app entry, so Cancel and Back (`navigate(-1)`) would have gone straight back to the recipe site, past the discard prompt (the blocker can't stop a navigation that leaves the app). So the import URL is replaced by the cookbook (`/`) and the form is pushed on top of it. History becomes *site → cookbook → form*: the long URL is gone, reload doesn't import again, and Cancel or Back asks "Discard changes?" and then lands in the cookbook. A ref guard keeps StrictMode's second effect run from pushing the form twice. **Bad data:** the page shows "Couldn't read that recipe" (plus a line pointing to Paste recipe), drops `d` from the URL and links to the cookbook. It doesn't redirect by itself, so the message stays readable; showing it on the cookbook instead would mean touching `CookbookPage`. **Signed out:** the route only mounts for members, so `App.tsx` keeps `d` in `sessionStorage` (`import.d`) while the session isn't a member, and the import page falls back to it when the URL has no `d`, then removes it. Sign-in is a popup (ADR-0003), so the URL normally survives anyway. **Photo fetch:** `useSitePhoto` in `EditPage.tsx` fetches `photoUrl` once (aborted on unmount). An error status, a network/CORS failure or a non-`image/` body shows the fallback alert with *Open the image* (new tab). Otherwise the image goes to `usePhotoDraft().stage`. While it loads, "Fetching the site's photo…" shows. If the member picks a photo meanwhile, theirs wins. **Duplicate notice:** `sameRecipeUrl` in `src/editing/recipeUrl.ts` (a URL typed without `https://` counts, the host's case is ignored, the path's case and the port count, and empty or non-http(s) addresses never match). The form shows "You already have this recipe" under the Source fields, with a link to the recipe ("(archived)" when it is). A recipe doesn't match itself when edited. Tests: `recipeUrl.test.ts` (19) and `ImportPage.test.tsx` (13). `npm run check` passes (522 tests) and `npm run build` works. The by-hand checks are left for the owner.
