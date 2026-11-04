import { createContext, useContext } from "react";
import type { StoredRecipe } from "../data/recipes.ts";

/** The live recipe list, shared by every member page (one subscription per session). */
export type LiveRecipes =
  | { status: "loading" }
  | { status: "ready"; recipes: StoredRecipe[] }
  | { status: "error"; message: string };

export const LiveRecipesContext = createContext<LiveRecipes>({ status: "loading" });

/** All recipes, archived ones included, kept up to date. */
export function useLiveRecipes(): LiveRecipes {
  return useContext(LiveRecipesContext);
}
