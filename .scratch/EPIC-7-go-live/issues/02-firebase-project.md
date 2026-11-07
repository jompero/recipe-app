# 02: Firebase project, sign-in and rules

Status: ready-for-human
Story: US-7.2
Spec: [../spec.md](../spec.md) (The Firebase project, Rules)
Blocked by: 01

The owner does this in the Firebase console and a terminal. Follow Phase 2 of `docs/project/project-setup.md` (as corrected by 01); this list is the short form. Console labels may have moved: if a step doesn't match what you see, note it under Comments.

## Steps

- [x] Firebase console → Add project. Name it `family-recipes`. Write down the **project ID** it gives (it may have a suffix). Google Analytics: off. Stay on the Spark plan.
- [x] Firestore → Create database: **Standard** edition, location **`europe-west2` (London)**, **Production mode**.
- [x] Authentication → Get started → Sign-in method → **Google** → Enable. Pick your support email.
- [x] Authentication → Settings → Authorized domains → Add `jompero.github.io` (domain only, no path). Don't add localhost.
- [x] Project settings → Your apps → Add app → **Web**. Nickname `recipe-app`; don't set up Hosting. Copy `apiKey`, `authDomain`, `projectId` and `appId` somewhere for 03 (they aren't secret).
- [x] Tell the agent the project ID. The agent commits the `prod` alias in `.firebaserc` (`default` stays `demo-recipe-app`), on a small branch `EPIC-7/US-7.2-prod-alias`.
- [ ] In a terminal: `npx firebase login` (once), then `npm run deploy:rules`.
- [ ] Firestore → Data → Start collection `allowed_users`. Add a document whose **ID is your Gmail address in lowercase**, with no fields (the console may need one dummy field; any is fine, the rules only check the ID exists).

## Check it worked

- [ ] Firestore → Rules shows our rules (the `allowed_users` and `recipes` matches), not the "deny all" default.
- [ ] Authentication → Sign-in method shows Google enabled; Authorized domains lists `jompero.github.io`.
- [ ] `allowed_users/<your-gmail>` exists.

## Comments

**2026-11-06:** Project ID is `family-recipes-64bda` (Firebase added a suffix). Steps 1–5 done by the owner; the agent added the `prod` alias to `.firebaserc`.
