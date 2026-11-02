# Google sign-in with `signInWithPopup`

We use Google sign-in instead of email/password. There are no passwords to manage, the emails are always verified, and we don't need a "disable registration" setting: a stranger can sign in but the rules give them nothing. We use `signInWithPopup` and not `signInWithRedirect`, because redirect sign-in breaks on browsers that block third-party storage (Safari/iOS, newer Chrome) when the app's domain (`*.github.io`) differs from the Firebase `authDomain` (`*.firebaseapp.com`), which is always the case on GitHub Pages.
