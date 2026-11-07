# 02: Verify `danijompero.com` for the account

Status: done
Story: US-8.2
Spec: [../spec.md](../spec.md) (Domain verification)
Blocked by: none

The owner does this in GitHub's **account** settings (not the repo's) and at one.com. It protects `recipes` and `www` from being claimed by someone else.

## Steps

- [x] GitHub → your profile picture → **Settings** → Code, planning, and automation → **Pages** → **Add a domain** → type `danijompero.com` → Add domain.
- [x] GitHub shows a TXT record: host `_github-pages-challenge-jompero` and a value. Copy the value.
- [x] one.com → DNS settings for `danijompero.com` → add a **TXT** record. Host: `_github-pages-challenge-jompero` (one.com usually adds `.danijompero.com` by itself; if the form shows the full name, check it doesn't end up doubled). Value: the one from GitHub. Leave the TTL at its default.
- [x] Wait a few minutes (DNS can take up to 24 hours), then back in GitHub click **Verify**.
- [x] **Keep the TXT record forever.** Removing it un-verifies the domain.

## Check it worked

- [x] GitHub's Pages settings list `danijompero.com` as **Verified**.
- [x] `www.danijompero.com` (the blog) still loads.

## Comments

**2026-11-07:** Done and checked by the owner.
