import { createContext, useContext, useEffect, useRef } from "react";

/**
 * An action the current page offers at the top of the menu overlay: either a page to go to
 * ("Edit recipe") or something to do once the menu has closed ("Archive", which asks first).
 */
export type PageAction = { label: string; to: string } | { label: string; onSelect: () => void };

/** Set by the member shell; pages report their actions through usePageActions. */
export const PageActionsContext = createContext<(actions: PageAction[]) => void>(() => {});

/** Shows these actions in the menu while the calling page is mounted. */
export function usePageActions(actions: PageAction[]) {
  const setActions = useContext(PageActionsContext);
  // Pages pass a fresh array (and fresh callbacks) on every render. The menu only needs updating
  // when the labels or targets change; callbacks always run the page's latest version.
  const latest = useRef(actions);
  useEffect(() => {
    latest.current = actions;
  });
  const key = JSON.stringify(
    actions.map((action) => [action.label, "to" in action ? action.to : null]),
  );
  useEffect(() => {
    const entries = JSON.parse(key) as [string, string | null][];
    setActions(
      entries.map(([label, to], index): PageAction =>
        to !== null
          ? { label, to }
          : {
              label,
              onSelect: () => {
                const action = latest.current[index];
                if (action && "onSelect" in action) action.onSelect();
              },
            },
      ),
    );
    return () => setActions([]);
  }, [setActions, key]);
}
