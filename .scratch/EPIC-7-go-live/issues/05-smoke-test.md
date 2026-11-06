# 05: Members and the iPhone smoke test

Status: ready-for-human
Story: US-7.5
Spec: [../spec.md](../spec.md) (Smoke test)
Blocked by: 04

The owner adds the members, then checks the live site on two iPhones with one of them. Nobody in the group has Android; that stays untested (Left for later).

## Steps

- [ ] Firestore console → `allowed_users` → add a document for each member, ID = their Gmail address in lowercase. Don't write the addresses anywhere in the repo.
- [ ] On both iPhones, in Safari, open `https://jompero.github.io/recipe-app/` and sign in (popup).
- [ ] Browse the cookbook, search, open a recipe. Leave it open for a few minutes without touching: the screen stays on.
- [ ] Add a new recipe with a photo taken with the camera. Check it shows on the other phone.
- [ ] Add a meal to the Plan on one phone; it appears on the other without refreshing. Move it, remove it.
- [ ] Build a grocery list; tick a line on one phone, it shows ticked on the other.
- [ ] Sign in with a Google account that isn't a member (or ask someone): the "not a member" screen, no data.

## Check it worked

- [ ] Every step above works on **both** phones. Write the iOS versions here.
- [ ] For each failure: a new issue in this folder (`NN-<slug>.md`, `Status: ready-for-agent`, `Story: US-7.5`) with what happened, on which phone, and a screenshot if possible. Link them here. 06 waits for them.

## Comments
