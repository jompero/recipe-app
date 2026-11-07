# 04: Custom domain, DNS and HTTPS

Status: done
Story: US-8.4
Spec: [../spec.md](../spec.md) (The address, HTTPS, The old address)
Blocked by: 01 (merged and deployed), 02, 03

This is the switch. The owner does this in the repo's Pages settings and at one.com. With 01 deployed, the app works at both addresses, so nothing goes down while the certificate is issued.

## Steps

- [x] Check 01's deploy is live: `https://jompero.github.io/recipe-app/` loads, and its page source references `./assets/`.
- [x] GitHub → **jompero/recipe-app** → Settings → **Pages** → Custom domain → type `recipes.danijompero.com` → **Save**. Do this before the DNS record (GitHub's advice). The DNS check will fail until the next step; that's expected.
- [x] one.com → DNS settings for `danijompero.com` → add a **CNAME** record. Host: `recipes`. Points to: `jompero.github.io` (no repo name, no trailing path). Default TTL. No other records on `recipes`.
- [x] If one.com shows any **CAA** records for `danijompero.com`, check one allows `letsencrypt.org`. If there are none, do nothing.
- [x] Back in Pages settings, wait for the DNS check to pass and the certificate to be issued (a check mark). The docs say it takes anywhere from an hour to 24 hours.
  - Stuck after a few hours? Click **Remove**, type `recipes.danijompero.com` again and **Save**. That restarts the certificate.
- [x] Tick **Enforce HTTPS**.

## Check it worked

- [x] `https://recipes.danijompero.com/` loads with styles and fonts, and the browser shows no certificate warning.
- [x] `http://recipes.danijompero.com/` redirects to `https://`.
- [x] `https://jompero.github.io/recipe-app/#/plan` lands on `https://recipes.danijompero.com/#/plan`.
- [x] Sign-in works at the new address.

## Rollback

If anything is broken and can't wait: Pages settings → Custom domain → **Remove**. github.io serves the app again (it still works with the relative base, and Firebase and the key still allow it).

## Comments

**2026-11-07:** Done and checked by the owner. The agent checked with curl: `https://jompero.github.io/recipe-app/x?y=1` → 301 `https://recipes.danijompero.com/x?y=1`; `http://recipes.danijompero.com/` → 301 to https; the page and its JS return 200 over HTTPS, and the bundle holds `family-recipes-64bda.firebaseapp.com`.
