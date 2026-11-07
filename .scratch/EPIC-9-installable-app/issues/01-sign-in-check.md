# 01: Sign-in check in a home-screen app

Status: done
Story: US-9.1
Spec: [../spec.md](../spec.md) (Sign-in)
Blocked by: none

The owner does this on their iPhone, on today's live site, before any Epic 9 code ships. Since iOS 26, any site added to the home screen opens as a web app even without a manifest, so the check works now. It answers one question: does Google sign-in (the popup, ADR-0003) work inside a home-screen app? Reports from 2025–2026 say it sometimes doesn't.

## Steps

- [x] Turn **Low Power Mode off** (so the Wake Lock check at the end means something).
- [x] In **Safari**, open `https://recipes.danijompero.com/`.
- [x] Tap **Share** → **Add to Home Screen**. Check **Open as Web App** is on → **Add**. (The icon will be a plain screenshot or letter for now; the real icon comes in 03/04.)
- [x] Open the app from the **home screen**. It should have no Safari address bar.
- [x] It should show the sign-in screen even though you're signed in in Safari (a home-screen app has its own storage). Tap **Sign in with Google** and finish signing in.
- [x] Note what happened: did the Google page open inside the app or in a separate sheet? Did you come back to the app **signed in**, with the cookbook showing?
- [x] Close the app fully (swipe it away in the app switcher), then open it again from the home screen. Note roughly how long it takes until the cookbook shows (instant, 1–2 s, 5 s or more).
- [x] Open a recipe and leave the phone alone for a minute: does the screen stay on?
- [x] Optional: repeat the install from **Chrome** on iOS (Share → Add to Home Screen) and sign in there.
- [x] Remove the test app from the home screen afterwards if you like (long-press → Remove App). Epic 9's real install comes later.

## Check it worked

- [x] Write the results under Comments: signed in yes/no, where the Google page opened, start time after a full close, Wake Lock yes/no, Chrome yes/no/skipped.

## What happens next

- **Signed in, normal start time:** ADR-0003 stands; 04 can start.
- **Sign-in fails, or start takes ~5 s or more:** the agent writes a fallback issue (spec, "Sign-in"), which goes before 04.

## Comments

**2026-11-07, owner, iPhone (live site, before any Epic 9 code):**
- Signed in: **yes**. The Google sign-in page opened **inside the app**, with no separate sheet or popup, and it came back signed in to the cookbook.
- Start time after a full close: about **1 s** to the cookbook. Instant when it was only in the background. No ~5 s helper-iframe delay.
- Wake Lock: the screen stayed on with a recipe open, **even with Low Power Mode on**. In the Epic 8 smoke test, Low Power Mode blocked it in Safari. Recheck in 07.
- Chrome on iOS: the same results.

Result: ADR-0003 stands. No fallback issue is needed, and 04 is unblocked once 03 is done.
