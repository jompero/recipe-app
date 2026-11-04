import { createContext, useContext, useEffect, useRef } from "react";

/**
 * An action the current page offers in the menu overlay: either a page to go to ("Edit recipe")
 * or something to do once the menu has closed ("Archive", which asks first).
 */
export type PageAction = { label: string; to: string } | { label: string; onSelect: () => void };

/** What the menu shows for the current page: its name, then its actions. */
export interface PageMenu {
  title: string | null;
  actions: PageAction[];
}

export const NO_PAGE_MENU: PageMenu = { title: null, actions: [] };

/** Set by the member shell; pages report their name and actions through usePageMenu. */
export const PageMenuContext = createContext<(menu: PageMenu) => void>(() => {});

/**
 * Names the calling page at the top of the menu (so actions like "Archive" have context) and
 * lists its actions, while the page is mounted.
 */
export function usePageMenu(title: string, actions: PageAction[] = []) {
  const setMenu = useContext(PageMenuContext);
  // Pages pass a fresh array (and fresh callbacks) on every render. The menu only needs updating
  // when the title, labels or targets change; callbacks always run the page's latest version.
  const latest = useRef(actions);
  useEffect(() => {
    latest.current = actions;
  });
  const key = JSON.stringify([
    title,
    actions.map((action) => [action.label, "to" in action ? action.to : null]),
  ]);
  useEffect(() => {
    const [menuTitle, entries] = JSON.parse(key) as [string, [string, string | null][]];
    setMenu({
      title: menuTitle,
      actions: entries.map(([label, to], index): PageAction =>
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
    });
    return () => setMenu(NO_PAGE_MENU);
  }, [setMenu, key]);
}
