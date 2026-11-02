# Ingredient lines keep the raw text as the source of truth

Each ingredient is stored as `{ raw, qty?, unit?, item? }` (or a section header such as `[While pasta is boiling]`). `raw` is exactly what was typed or imported. The parsed fields are filled in by a parser when saving and can be corrected by hand. Unit conversion and grocery merging need structured quantities, but the Pepperplate data and pasted recipes are free text. Keeping the raw text means nothing is lost when the parser gets a line wrong, and an improved parser can be run again over the whole collection.
