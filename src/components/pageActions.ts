import { createContext, useContext, useEffect } from "react";

/** An action the current page offers at the top of the menu overlay, e.g. "Edit recipe". */
export interface PageAction {
  label: string;
  /** Where choosing it goes. */
  to: string;
}

/** Set by the member shell; pages report their actions through usePageActions. */
export const PageActionsContext = createContext<(actions: PageAction[]) => void>(() => {});

/** Shows these actions in the menu while the calling page is mounted. */
export function usePageActions(actions: PageAction[]) {
  const setActions = useContext(PageActionsContext);
  // Compare by value, so pages can pass a fresh array literal on every render.
  const key = JSON.stringify(actions);
  useEffect(() => {
    setActions(JSON.parse(key) as PageAction[]);
    return () => setActions([]);
  }, [setActions, key]);
}
