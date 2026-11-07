# 05: Smoke test and remove the old origin

Status: ready-for-human
Story: US-8.5
Spec: [../spec.md](../spec.md) (The old address, Per-origin state)
Blocked by: 04

The owner tests on their iPhone and desktop, then tidies up the old address. Members don't take part.

## Smoke test

On `https://recipes.danijompero.com/`:

- [ ] iPhone: open the old address `https://jompero.github.io/recipe-app/#/plan`. It lands on the Plan at the new address.
- [ ] iPhone and desktop: sign in with the popup. You land in the cookbook as a member.
- [ ] Open a recipe. Photos show, and the screen stays awake.
- [ ] Edit the Plan on the iPhone and see it appear on the desktop without refreshing.
- [ ] Tick a grocery line on one and see it on the other.
- [ ] Desktop: reinstall the bookmarklet from the Data page, then use it on a recipe site. The New recipe form opens at the new address, filled in. Don't save the recipe unless you want it.
- [ ] Use an **old** bookmarklet if you still have one. It should also land at the new address through the redirect.

It passes only when every item works. Anything that fails becomes a new numbered fix issue in this folder (`ready-for-agent`).

## Remove the old origin

Only after the smoke test passes:

- [ ] Firebase console → Authentication → Settings → Authorized domains → delete `jompero.github.io`.
- [ ] Google Cloud console → Credentials → Browser key → Websites → delete `https://jompero.github.io/*`. Keep `https://recipes.danijompero.com/*` and `https://family-recipes-64bda.firebaseapp.com/*`. Save.
- [ ] After ~5 minutes: sign out at the new address, close the tab, open it again and sign in.

## Tell the members

- [ ] Send the group a short message: the app is now at `https://recipes.danijompero.com/`. Old links still work. Sign in once more. Reinstalling the bookmarklet is optional.

## Check it worked

- [ ] Sign-in at the new address works after removing the old origin.
- [ ] The old address still redirects.

## Comments
