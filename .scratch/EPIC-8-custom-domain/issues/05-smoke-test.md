# 05: Smoke test and remove the old origin

Status: done
Story: US-8.5
Spec: [../spec.md](../spec.md) (The old address, Per-origin state)
Blocked by: 04

The owner tests on their iPhone and desktop, then tidies up the old address. Members don't take part.

## Smoke test

On `https://recipes.danijompero.com/`:

- [x] iPhone: open the old address `https://jompero.github.io/recipe-app/#/plan`. It lands on the Plan at the new address.
- [x] iPhone and desktop: sign in with the popup. You land in the cookbook as a member.
- [x] Open a recipe. Photos show, and the screen stays awake.
- [x] Edit the Plan on the iPhone and see it appear on the desktop without refreshing.
- [x] Tick a grocery line on one and see it on the other.
- [x] Desktop: reinstall the bookmarklet from the Data page, then use it on a recipe site. The New recipe form opens at the new address, filled in. Don't save the recipe unless you want it.
- [x] Use an **old** bookmarklet if you still have one. It should also land at the new address through the redirect.

It passes only when every item works. Anything that fails becomes a new numbered fix issue in this folder (`ready-for-agent`).

## Remove the old origin

Only after the smoke test passes:

- [x] Firebase console → Authentication → Settings → Authorized domains → delete `jompero.github.io`.
- [x] Google Cloud console → Credentials → Browser key → Websites → delete `https://jompero.github.io/*`. Keep `https://recipes.danijompero.com/*` and `https://family-recipes-64bda.firebaseapp.com/*`. Save.
- [x] After ~5 minutes: sign out at the new address, close the tab, open it again and sign in.

## Tell the members

- [x] Send the group a short message: the app is now at `https://recipes.danijompero.com/`. Old links still work. Sign in once more. Reinstalling the bookmarklet is optional.

## Check it worked

- [x] Sign-in at the new address works after removing the old origin.
- [x] The old address still redirects.

## Comments

**2026-11-07:** Done by the owner on their iPhone (Safari and Chrome) and desktop. At first the screen didn't stay awake: Low Power Mode was on, and iOS refuses wake locks in Low Power Mode. With it off, the screen stays awake. Not a bug: `useWakeLock` catches the refusal by design. Found with a `javascript:` bookmark probe on the live site. The owner decided not to add a hint to the app. Every other item passed. Then `jompero.github.io` was removed from Firebase authorized domains and the API key referrers, sign-in was checked again, and the members were told. The old address still returns a 301 to the new one.
