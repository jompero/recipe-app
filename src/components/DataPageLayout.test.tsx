import { render, screen } from "../test-utils/render.tsx";
import { DataPage } from "./DataPage.tsx";

// The layout only: the sections' behaviour is tested in DataPage.test.tsx and friends.
const fakes = vi.hoisted(() => ({ wide: false }));
vi.mock("./useWide.ts", () => ({ useWide: () => fakes.wide }));
vi.mock("../data/recipes.ts", () => ({ existingRecipeIds: vi.fn(), saveRecipes: vi.fn() }));
vi.mock("../data/backup.ts", () => ({ exportEverything: vi.fn(), restoreEverything: vi.fn() }));

function column(): HTMLElement {
  const heading = screen.getByRole("heading", { level: 1, name: "Data" });
  if (heading.parentElement === null) throw new Error("the heading has no column");
  return heading.parentElement;
}

test("the page title is a top-level heading, like the other pages", () => {
  render(<DataPage />);
  expect(screen.getByRole("heading", { level: 1, name: "Data" })).toBeInTheDocument();
});

test("a divider sits between each of the five sections", () => {
  render(<DataPage />);
  expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(5);
  expect(screen.getAllByRole("separator")).toHaveLength(4);
});

test("on a phone the sections use the full width", () => {
  fakes.wide = false;
  render(<DataPage />);
  expect(column().style.maxWidth).toBe("");
});

test("on a wide screen the sections sit in a 720px column", () => {
  fakes.wide = true;
  render(<DataPage />);
  // Mantine writes 720px as rem: 720 / 16 = 45.
  expect(column().style.maxWidth).toBe("calc(45rem * var(--mantine-scale))");
});
