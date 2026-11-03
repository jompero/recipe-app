# 07: Seed the emulator from the base data

Status: ready-for-agent
Story: US-2.7
Branch: `EPIC-2/US-2.7-seed-base-data`
Spec: [../spec.md](../spec.md)
Blocked by: 06

## What to build

- Gitignore `.scratch/base-data/`.
- `npm run seed` still writes the fake members. If `.scratch/base-data/recipes-export.json` exists, it also loads its recipes, images and menu days into the emulator (bypassing the rules, ISO dates converted back to timestamps). If the file is missing, it prints how to create it: import on the Data page, then Export, then save the file there.
- README: the base-data flow, and backing up the file off the laptop together with the Pepperplate originals.

## Acceptance criteria

- [ ] With the file present, a wiped emulator plus `npm run seed` shows all recipes with photos in the app.
- [ ] Without the file, seed still adds the members and prints the hint, and exits successfully.
- [ ] CI doesn't need the file.

## Comments
