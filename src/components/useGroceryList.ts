import { useEffect, useState } from "react";
import { watchGroceryList, type GroceryList } from "../data/groceries.ts";

/** The shared grocery list, kept up to date. */
export type LiveGroceryList =
  | { status: "loading" }
  | { status: "ready"; list: GroceryList }
  | { status: "error"; message: string };

/** Watches the grocery list while mounted. */
export function useGroceryList(): LiveGroceryList {
  const [live, setLive] = useState<LiveGroceryList>({ status: "loading" });
  useEffect(
    () =>
      watchGroceryList(
        (list) => setLive({ status: "ready", list }),
        (error) => setLive({ status: "error", message: error.message }),
      ),
    [],
  );
  return live;
}
