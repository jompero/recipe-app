# Menus are one document per date

The menu is stored as `menu_days/{YYYY-MM-DD}` holding `{ entries: [{ recipeId, slot? }] }`, not the blueprint's `weekly_menus` document with `Monday`…`Sunday` fields. Browsing any date range, viewing history, rolling dice across a range and building grocery lists all become simple range queries on the document ID, and a day can hold several meals. Entries are added with `arrayUnion`, so two people adding to the same day don't overwrite each other. Recipes are archived (`archived: true`) instead of deleted, so past menus never point at a missing recipe.
