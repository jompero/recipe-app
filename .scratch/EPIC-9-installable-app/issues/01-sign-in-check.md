# 01: Sign-in check in a home-screen app

Status: ready-for-human
Story: US-9.1
Spec: [../spec.md](../spec.md) (Sign-in)
Blocked by: none

The owner does this on their iPhone, on today's live site, before any Epic 9 code ships. Since iOS 26, any site added to the home screen opens as a web app even without a manifest, so the check works now. It answers one question: does Google sign-in (the popup, ADR-0003) work inside a home-screen app? Reports from 2025–2026 say it sometimes doesn't.

## Steps

- [ ] Turn **Low Power Mode off** (so the Wake Lock check at the end means something).
- [ ] In **Safari**, open `https://recipes.danijompero.com/`.
- [ ] Tap **Share** → **Add to Home Screen**. Check **Open as Web App** is on → **Add**. (The icon will be a plain screenshot or letter for now; the real icon comes in 03/04.)
- [ ] Open the app from the **home screen**. It should have no Safari address bar.
- [ ] It should show the sign-in screen even though you're signed in in Safari (a home-screen app has its own storage). Tap **Sign in with Google** and finish signing in.
- [ ] Note what happened: did the Google page open inside the app or in a separate sheet? Did you come back to the app **signed in**, with the cookbook showing?
- [ ] Close the app fully (swipe it away in the app switcher), then open it again from the home screen. Note roughly how long it takes until the cookbook shows (instant, 1–2 s, 5 s or more).
- [ ] Open a recipe and leave the phone alone for a minute: does the screen stay on?
- [ ] Optional: repeat the install from **Chrome** on iOS (Share → Add to Home Screen) and sign in there.
- [ ] Remove the test app from the home screen afterwards if you like (long-press → Remove App). Epic 9's real install comes later.

## Check it worked

- [ ] Write the results under Comments: signed in yes/no, where the Google page opened, start time after a full close, Wake Lock yes/no, Chrome yes/no/skipped.

## What happens next

- **Signed in, normal start time:** ADR-0003 stands; 04 can start.
- **Sign-in fails, or start takes ~5 s or more:** the agent writes a fallback issue (spec, "Sign-in"), which goes before 04.

## Comments
