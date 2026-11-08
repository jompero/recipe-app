/** The app's sections, in the menu overlay (phones) and the top bar (wide screens). */
export const SECTIONS = [
  { label: "Cookbook", path: "/" },
  { label: "Plan", path: "/plan" },
  { label: "Grocery list", path: "/groceries" },
  { label: "Data", path: "/data" },
  { label: "Account", path: "/account" },
] as const;

export type SectionPath = (typeof SECTIONS)[number]["path"];

/**
 * The section a page belongs to: the roller is part of the Plan, a recipe (or the paste and
 * import pages that make one) part of the cookbook.
 */
export function sectionOf(pathname: string): SectionPath {
  const match = SECTIONS.find(
    ({ path }) => path !== "/" && (pathname === path || pathname.startsWith(`${path}/`)),
  );
  return match?.path ?? "/";
}
