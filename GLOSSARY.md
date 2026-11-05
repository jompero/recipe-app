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
