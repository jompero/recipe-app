# 03: Firebase authorized domain and API key referrer

Status: done
Story: US-8.3
Spec: [../spec.md](../spec.md) (Firebase and the API key)
Blocked by: none

The owner does this in the Firebase console and the Google Cloud console for project `family-recipes-64bda`. It only **adds** the new address; nothing is removed yet, so the live site isn't affected.

## Steps

- [x] Firebase console → `family-recipes-64bda` → Authentication → **Settings** → **Authorized domains** → Add domain → `recipes.danijompero.com`. Keep `jompero.github.io` and the defaults.
- [x] Google Cloud console (same project) → APIs & Services → **Credentials** → "Browser key (auto created by Firebase)" → Application restrictions → Websites → **Add** `https://recipes.danijompero.com/*`. Keep `https://jompero.github.io/*` and `https://family-recipes-64bda.firebaseapp.com/*`. Don't touch the API restrictions. Save.

## Check it worked

- [x] The authorized domains list shows `recipes.danijompero.com` and `jompero.github.io`.
- [x] The key's referrers list all three entries.
- [x] After ~5 minutes, sign-in still works at `https://jompero.github.io/recipe-app/`. Sign-in at the new address can't be tested until 04.

## Comments

**2026-11-07:** Done and checked by the owner.
