# 05: Members and the iPhone smoke test

Status: done
Story: US-7.5
Spec: [../spec.md](../spec.md) (Smoke test)
Blocked by: 04

The owner adds the members, then checks the live site on two iPhones with one of them. Nobody in the group has Android; that stays untested (Left for later).

## Steps

- [x] Firestore console → `allowed_users` → add a document for each member, ID = their Gmail address in lowercase. Don't write the addresses anywhere in the repo.
- [x] On both iPhones, in Safari, open `https://jompero.github.io/recipe-app/` and sign in (popup).
- [x] Browse the cookbook, search, open a recipe. Leave it open for a few minutes without touching: the screen stays on.
- [x] Add a new recipe with a photo taken with the camera. Check it shows on the other phone.
- [x] Add a meal to the Plan on one phone; it appears on the other without refreshing. Move it, remove it.
- [x] Build a grocery list; tick a line on one phone, it shows ticked on the other.
- [x] Sign in with a Google account that isn't a member (or ask someone): the "not a member" screen, no data.

## Check it worked

- [x] Every step above works on **both** phones. Write the iOS versions here.
- [x] For each failure: a new issue in this folder (`NN-<slug>.md`, `Status: ready-for-agent`, `Story: US-7.5`) with what happened, on which phone, and a screenshot if possible. Link them here. 06 waits for them.

## Comments

**2026-11-07 (owner, in progress):** iPhone 15 Pro Max (MU773QN/A). Findings so far, added to `docs/backlog.md` under Epic 7 as left for later (no code changes in this epic): inputs zoom in on focus and stay zoomed (not the cookbook search); iPad and desktop layout; the roller's Roll button is at the bottom; opening on the menu is janky, open on the cookbook instead.

**2026-11-07 (owner):** Every original step passed on both phones: an iPhone 15 Pro Max (MU773QN/A) and an iPhone 14, both on iOS 26.6.2. No failures, so no fix issues. The findings above are in the backlog as left for later.
