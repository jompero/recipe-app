# Recipe App

A shared cookbook and meal planner for a small, whitelisted group of members.

## Planning

**Plan**:
The shared calendar of what the members will eat (and have eaten), shown a week at a time. Stored as the `menu_days` collection.
_Avoid_: Menu (the overlay button is "the menu"), calendar, meal plan

**Plan day**:
One date in the Plan and the entries on it. One `menu_days/{YYYY-MM-DD}` document, keyed by the local calendar date.
_Avoid_: Menu day, slot

**Entry**:
One item on a Plan day: either a recipe or a note. Has its own random ID, so the same recipe can appear twice on a day.
_Avoid_: Meal (in code), item

**Note**:
An entry that is short text instead of a recipe, e.g. "Leftovers" or "Eating out". Ignored by the grocery list.

**Roll**:
Random suggestions of recipes for a range of Plan days, made on the roller page and added to the Plan only when saved.
_Avoid_: Shuffle, randomise

**Locked**, **Skipped**:
A day in a roll that keeps its recipe when the rest are rolled again (Locked), or gets no recipe at all (Skipped). A day that is neither is Rolled.

**Scale**:
How many times a planned recipe's amounts are counted: ½×, 1×, 2× or 3×. Set on a recipe entry in the Plan and used by the grocery list. The recipe page has its own scale buttons, which aren't saved.

## Shopping

**Grocery list**:
The one shared shopping list, built from a range of Plan days and saved as a snapshot. Stored as `grocery_lists/current`.
_Avoid_: Shopping list (in code), cart

**Source line**:
One ingredient line on the grocery list as it came from a recipe (with that entry's scale), or an item added by hand. Ticks belong to source lines.
_Avoid_: Item

**Merged line**:
The source lines that share a merge key, shown as one line with one combined amount. It is ticked when all its source lines are ticked, and partly ticked when only some are.

**Merge key**:
An ingredient name cleaned up for matching: lowercase, without brackets, comma tail or a leading "of", in the singular, then mapped through the synonym table. Prep words such as "chopped" stay, so "chopped tomatoes" and "tomatoes" are different keys.

## The app on a phone

**Installed app**:
The app added to a phone's home screen and opened from there, full screen. It keeps its own sign-in and offline copy, separate from the same site in Safari.
_Avoid_: PWA (in the interface), home-screen app, web app

**Update banner**:
The strip at the top that says a new version is ready, with a Reload button. The new version waits until it is tapped, or until the next fresh launch.
_Avoid_: Update prompt, refresh toast
