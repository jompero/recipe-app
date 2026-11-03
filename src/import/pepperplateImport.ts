// Turns the picked Pepperplate files into an import preview (US-2.5). Pure: no Firebase, no files.
import { parseRecipeText } from "../parsing/recipeText.ts";
import type { RecipeDraft } from "../parsing/types.ts";

/** A picked recipe file and its text. */
export interface PickedText {
  name: string;
  text: string;
}

export interface PreviewRecipe {
  id: string;
  fileName: string;
  recipe: RecipeDraft;
  /** The matching photo's file name, or null if there's none. */
  photoFileName: string | null;
  /** Problems worth a look before importing: "No photo", "No ingredients", "No instructions". */
  warnings: string[];
  /** Ingredient lines the parser found no amount in ("Salt & pepper"); shown, not warned about. */
  linesWithoutAmount: number;
}

export interface ImportPreview {
  recipes: PreviewRecipe[];
  totals: {
    recipes: number;
    withPhoto: number;
    ingredientLines: number;
    linesWithoutAmount: number;
  };
}

function stem(fileName: string): string {
  return fileName.replace(/\.[^.]*$/, "");
}

/** Parses the picked recipe files and matches each to its photo by file name. */
export function buildImportPreview(
  textFiles: PickedText[],
  imageFileNames: string[],
): ImportPreview {
  const photosByStem = new Map(
    imageFileNames.filter((name) => /\.jpe?g$/i.test(name)).map((name) => [stem(name), name]),
  );

  const recipes = textFiles
    .filter((file) => /\.txt$/i.test(file.name))
    .map((file): PreviewRecipe => {
      const { recipe, warnings } = parseRecipeText(file.text);
      const photoFileName = photosByStem.get(stem(file.name)) ?? null;
      const ingredients = recipe.ingredients.flatMap((line) => ("raw" in line ? [line] : []));
      return {
        id: recipeIdFromFileName(file.name),
        fileName: file.name,
        recipe,
        photoFileName,
        warnings: [...(photoFileName === null ? ["No photo"] : []), ...warnings],
        linesWithoutAmount: ingredients.filter((line) => line.qty === undefined).length,
      };
    });

  return {
    recipes,
    totals: {
      recipes: recipes.length,
      withPhoto: recipes.filter((recipe) => recipe.photoFileName !== null).length,
      ingredientLines: recipes.reduce(
        (sum, { recipe }) => sum + recipe.ingredients.filter((line) => "raw" in line).length,
        0,
      ),
      linesWithoutAmount: recipes.reduce((sum, recipe) => sum + recipe.linesWithoutAmount, 0),
    },
  };
}

/** The recipe's database ID: its file name in kebab-case, so re-importing replaces it. */
export function recipeIdFromFileName(fileName: string): string {
  return fileName
    .replace(/\.[^.]*$/, "") // drop the extension
    .replace(/([a-z])([A-Z0-9])/g, "$1-$2") // pulledOats, Eddiebuns24
    .replace(/([0-9])([A-Za-z])/g, "$1-$2") // 15Min, 24butts
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2") // PBJOat, ACrunch
    .replace(/[^A-Za-z0-9]+/g, "-") // underscores and anything else
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}
