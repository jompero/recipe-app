# 06: Archive

Status: ready-for-agent
Story: US-3.6
Branch: `EPIC-3/US-3.6-archive`
Spec: [../spec.md](../spec.md)
Blocked by: 04

## What to build

- **Data:** `archiveRecipe(id)` / `unarchiveRecipe(id)` in `src/data/recipes.ts`, setting `archived` and `updatedAt: serverTimestamp()`. Check that the update passes the shape rules (the rules may require the whole document; if so, write it whole, as in 05). Nothing deletes.
- **Recipe page overlay:** *Archive* with a confirmation, or *Unarchive* on an archived recipe. After archiving, go back to the grid.
- **Show archived** (`#/?archived=1`, from the grid's overlay): the same grid showing only archived recipes, each with an *Unarchive* button. Archived recipes never appear in the normal grid or its search.

## Acceptance criteria

- [ ] Emulator tests: archive then unarchive pass the rules and update `updatedAt`; deleting is still denied.
- [ ] Component tests with `src/data` faked: archive asks for confirmation and calls the data function; the archived view lists only archived recipes and unarchives; the normal grid hides them.
- [ ] By hand: archive a recipe on one device and see it leave the grid on another.

## Comments
