# 04: Move the data

Status: ready-for-human
Story: US-7.4
Spec: [../spec.md](../spec.md) (Moving the data, Backups)
Blocked by: 03

The owner moves the emulator data to the live site with the Data page.

## Steps

- [ ] Locally (`npm run dev:all`): delete test recipes and test Plan entries you don't want to keep. Archived recipes come along too; unarchive or delete as you like.
- [ ] Local Data page → **Export everything**. Keep the file somewhere outside the repo (it's your first backup).
- [ ] Stop `dev:all` carefully (see the memory note on stopping it on Windows), so the emulator data isn't lost before the restore is done.
- [ ] Live site → Data page → **Restore** with that file. Wait until it says it's done; don't close the tab during it.

## Check it worked

- [ ] The live cookbook shows the same number of recipes as the emulator (and the same archived ones).
- [ ] A few recipes with photos show their photo and thumbnail.
- [ ] The Plan shows the weeks you had locally.
- [ ] Firebase console → Usage: the writes are far below 20,000 for the day.

## Comments
