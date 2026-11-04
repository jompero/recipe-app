import { useEffect, useState, type ReactNode } from "react";
import { watchRecipes } from "../data/recipes.ts";
import { LiveRecipesContext, type LiveRecipes } from "./liveRecipes.ts";

/** Subscribes once to the recipes and shares them with the pages below. */
export function LiveRecipesProvider({ children }: { children: ReactNode }) {
  const [live, setLive] = useState<LiveRecipes>({ status: "loading" });
  useEffect(
    () =>
      watchRecipes(
        (recipes) => setLive({ status: "ready", recipes }),
        (error) => setLive({ status: "error", message: error.message }),
      ),
    [],
  );
  return <LiveRecipesContext.Provider value={live}>{children}</LiveRecipesContext.Provider>;
}
