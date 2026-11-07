# 07: Smoke test on two iPhones

Status: ready-for-human
Story: US-9.7
Spec: [../spec.md](../spec.md)
Blocked by: 01–06 merged and deployed (plus the sign-in fallback issue, if 01 needed one)

The owner on their iPhone, and one member on theirs, on the live site `https://recipes.danijompero.com/`. **Low Power Mode off** on both. If you installed a test app in 01, remove it first.

## Install (both phones)

- [ ] In Safari, open the site and go to **Data**: the "Install on your phone" note shows. Follow it: Share → Add to Home Screen (Open as Web App on) → Add.
- [ ] The home screen shows the **cast-iron pot** icon with the name underneath, not cut off.
- [ ] Open it: full screen, no Safari bars. The status bar matches the page colour.
- [ ] Sign in once more. It lands on the **cookbook**, menu closed.
- [ ] Data page: the install note is **gone** in the installed app.

## Everyday use (both phones)

- [ ] Tap into the cookbook search, a recipe's edit form and the grocery list's "add item": **no zoom**.
- [ ] Open a recipe and leave the phone for a minute: the **screen stays on**.
- [ ] On the roller (`#/plan/roll`), Roll again is reachable without scrolling.

## Offline (owner's phone)

- [ ] Open a recipe with a photo, the Plan and the grocery list once while online.
- [ ] Turn on **Airplane Mode**. Within a few seconds the **offline strip** shows.
- [ ] Close the app fully and open it again from the home screen: it **opens**, with the strip, and the cookbook shows.
- [ ] Open the recipe from before: text and photo show. Open a recipe never opened on this phone: it shows its thumbnail (or the no-photo look).
- [ ] Tick two grocery items and move a Plan entry.
- [ ] Data page: Import and Restore say "Needs a connection".
- [ ] Turn Airplane Mode off: the strip goes away. On the **member's phone**, the ticks and the moved entry appear.

## Update banner

- [ ] When the agent merges a small change (the docs sweep 08, or any fix issue), keep the installed app open, or bring it back from the background a few minutes after the deploy: "Update ready · Reload" appears. Tap Reload: the app reloads and keeps working.

## Chrome on iOS (member's or owner's phone)

- [ ] In Chrome, Share → Add to Home Screen, open it, sign in, open a recipe. (If it behaves differently from Safari, note how.)

## Check it worked

- [ ] Write the results under Comments, per phone (model, iOS version). Anything that failed becomes a new numbered fix issue in this folder.

## Comments
