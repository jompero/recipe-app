import { parseIngredientLine } from "./ingredientLine.ts";
import type { RecipeDraft } from "./types.ts";

export interface ParsedRecipe {
  recipe: RecipeDraft;
  warnings: string[];
}

/** Header keys in a Pepperplate export, mapped to the recipe field they fill. */
const HEADER_FIELDS = {
  Title: "title",
  Description: "description",
  Source: "source",
  "Original URL": "sourceUrl",
  Yield: "yield",
  Active: "activeTime",
  Total: "totalTime",
} as const;

type HeaderKey = keyof typeof HEADER_FIELDS;
type HeaderField = (typeof HEADER_FIELDS)[HeaderKey];

function isHeaderKey(key: string): key is HeaderKey {
  return Object.hasOwn(HEADER_FIELDS, key);
}

/** Parses one Pepperplate `.txt` export into a recipe draft. */
export function parseRecipeText(text: string): ParsedRecipe {
  const recipe: RecipeDraft = {
    title: "",
    description: "",
    source: "",
    sourceUrl: "",
    yield: "",
    activeTime: "",
    totalTime: "",
    tags: [],
    ingredients: [],
    instructions: [],
  };

  let section: "header" | "ingredients" | "instructions" | "notes" = "header";
  let currentField: HeaderField | undefined;
  const notes: string[] = [];

  for (const line of text.split(/\r?\n/)) {
    if (section === "notes") {
      // Notes are the last block and run to the end of the file, "Key:"-looking lines included.
      notes.push(line.trimEnd());
      continue;
    }
    if (line === "Ingredients:") {
      section = "ingredients";
      continue;
    }
    if (line === "Instructions:") {
      section = "instructions";
      continue;
    }

    if (section === "header") {
      const [, key = "", value = ""] = /^([A-Za-z ]+):\s?(.*)$/.exec(line) ?? [];
      if (isHeaderKey(key)) {
        currentField = HEADER_FIELDS[key];
        recipe[currentField] = value.trim();
      } else if (key === "Categories") {
        currentField = undefined;
        recipe.tags = value
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter((tag) => tag !== "");
      } else if (key === "Image") {
        // Photos are matched by file name (US-2.5), not by this CDN link.
        currentField = undefined;
      } else if (currentField !== undefined) {
        // Not a known key (e.g. "Durability in freezer: …"): the field above runs on.
        recipe[currentField] = `${recipe[currentField]}\n${line.trim()}`.trim();
      }
      continue;
    }

    if (line.startsWith("Notes:")) {
      section = "notes";
      notes.push(line.slice("Notes:".length).trim());
      continue;
    }

    const content = line.trim();
    if (content === "") continue;
    const header = /^\[(.*)\]$/.exec(content)?.[1];
    if (section === "ingredients") {
      recipe.ingredients.push(
        header !== undefined ? { header: header.trim() } : parseIngredientLine(content),
      );
    } else {
      recipe.instructions.push(
        header !== undefined ? { header: header.trim() } : { text: content },
      );
    }
  }

  const notesText = notes.join("\n").trim();
  if (notesText !== "") {
    recipe.description =
      recipe.description === "" ? notesText : `${recipe.description}\n\n${notesText}`;
  }

  const warnings: string[] = [];
  if (recipe.title === "") warnings.push("No title");
  if (!recipe.ingredients.some((line) => "raw" in line)) warnings.push("No ingredients");
  if (!recipe.instructions.some((line) => "text" in line)) warnings.push("No instructions");

  return { recipe, warnings };
}
