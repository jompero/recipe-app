import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Session } from "../data/auth.ts";
import type { StoredRecipe } from "../data/recipes.ts";
import type { RecipeDraft } from "../parsing/types.ts";
import { storedRecipe } from "../test-utils/recipeFixture.ts";
import { renderApp, screen } from "../test-utils/renderApp.tsx";

// Fake the data seam: a member, the live recipe list, and the two saves.
const fake = vi.hoisted(() => ({
  recipes: [] as StoredRecipe[],
  updateRecipe: vi.fn<(id: string, recipe: RecipeDraft) => Promise<void>>(),
  createRecipe: vi.fn<(recipe: RecipeDraft) => Promise<string>>(),
}));
vi.mock("../data/recipes.ts", () => ({
  watchRecipes: (onChange: (recipes: StoredRecipe[]) => void) => {
    onChange(fake.recipes);
    return () => {};
  },
  updateRecipe: fake.updateRecipe,
  createRecipe: fake.createRecipe,
  setArchived: vi.fn(),
  existingRecipeIds: vi.fn(),
  saveRecipes: vi.fn(),
}));
vi.mock("../data/images.ts", () => ({ loadFullImage: vi.fn(() => Promise.resolve(null)) }));
vi.mock("../data/backup.ts", () => ({ exportEverything: vi.fn(), restoreEverything: vi.fn() }));
vi.mock("../data/auth.ts", () => ({
  watchSession: (onChange: (session: Session) => void) => {
    onChange({ status: "member", user: { name: "Ada", email: "ada@example.com", photoUrl: null } });
    return () => {};
  },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

const soup = storedRecipe("Chicken Soup", {
  source: "Valdemarsro",
  tags: ["chicken", "soup"],
  ingredients: [
    { raw: "1 kg chicken thighs", qty: 1, unit: "kg", item: "chicken thighs" },
    { header: "For the broth" },
    { raw: "Salt & pepper", item: "Salt & pepper" },
  ],
  instructions: [{ text: "Brown the chicken." }],
});

beforeEach(() => {
  fake.recipes = [soup, storedRecipe("Salad", { tags: ["salad", "summer"] })];
  fake.updateRecipe.mockReset().mockResolvedValue(undefined);
  fake.createRecipe.mockReset().mockResolvedValue("NewRecipeId123");
});

const field = (name: string) => screen.getByRole("textbox", { name });

async function chooseFromMenu(action: string) {
  await userEvent.click(screen.getByRole("button", { name: "Menu" }));
  const menu = await screen.findByRole("dialog", { name: "Menu" });
  await userEvent.click(within(menu).getByRole("button", { name: action }));
}

test("Edit recipe in the recipe's menu opens the form, filled in, with Save and Cancel", async () => {
  const { router } = renderApp("/recipe/chicken-soup");
  await chooseFromMenu("Edit recipe");

  expect(router.state.location.pathname).toBe("/recipe/chicken-soup/edit");
  expect(field("Title")).toHaveValue("Chicken Soup");
  expect(field("Source")).toHaveValue("Valdemarsro");
  expect(field("Ingredients")).toHaveValue("1 kg chicken thighs\n\n[For the broth]\nSalt & pepper");
  expect(field("Method")).toHaveValue("Brown the chicken.");
  expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  // The Save / Cancel bar replaces the menu button.
  expect(screen.queryByRole("button", { name: "Menu" })).not.toBeInTheDocument();
});

test("saving sends the edited recipe, amounts recalculated, and returns to it", async () => {
  const { router } = renderApp("/recipe/chicken-soup");
  await chooseFromMenu("Edit recipe");

  await userEvent.clear(field("Title"));
  await userEvent.type(field("Title"), "Better Soup");
  await userEvent.clear(field("Ingredients"));
  await userEvent.type(field("Ingredients"), "500 g chicken{Enter}Salt");
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  expect(fake.updateRecipe).toHaveBeenCalledWith(
    "chicken-soup",
    expect.objectContaining({
      title: "Better Soup",
      tags: ["chicken", "soup"],
      ingredients: [
        { raw: "500 g chicken", qty: 500, unit: "g", item: "chicken" },
        { raw: "Salt", item: "Salt" },
      ],
    }),
  );
  expect(router.state.location.pathname).toBe("/recipe/chicken-soup");
});

test("a title is required: Save shows why and saves nothing", async () => {
  renderApp("/recipe/chicken-soup/edit");
  await userEvent.clear(field("Title"));
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  expect(screen.getByText("A recipe needs a title")).toBeInTheDocument();
  expect(fake.updateRecipe).not.toHaveBeenCalled();
});

describe("leaving with unsaved changes", () => {
  test("Cancel without changes leaves at once", async () => {
    const { router } = renderApp("/recipe/chicken-soup");
    await chooseFromMenu("Edit recipe");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(router.state.location.pathname).toBe("/recipe/chicken-soup");
    expect(screen.queryByRole("dialog", { name: "Discard changes?" })).not.toBeInTheDocument();
  });

  test("Cancel with changes asks first: Keep editing stays, Discard leaves without saving", async () => {
    const { router } = renderApp("/recipe/chicken-soup");
    await chooseFromMenu("Edit recipe");
    await userEvent.type(field("Title"), " (spicy)");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    let prompt = await screen.findByRole("dialog", { name: "Discard changes?" });
    await userEvent.click(within(prompt).getByRole("button", { name: "Keep editing" }));
    expect(router.state.location.pathname).toBe("/recipe/chicken-soup/edit");
    expect(field("Title")).toHaveValue("Chicken Soup (spicy)");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    prompt = await screen.findByRole("dialog", { name: "Discard changes?" });
    await userEvent.click(within(prompt).getByRole("button", { name: "Discard" }));
    expect(router.state.location.pathname).toBe("/recipe/chicken-soup");
    expect(fake.updateRecipe).not.toHaveBeenCalled();
  });

  test("phone Back with changes asks too", async () => {
    const { router, back } = renderApp("/recipe/chicken-soup");
    await chooseFromMenu("Edit recipe");
    await userEvent.type(field("Method"), " Then rest.");

    await back();
    expect(await screen.findByRole("dialog", { name: "Discard changes?" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/recipe/chicken-soup/edit");
  });
});

test("tags: suggestions come from tags in use, and typed tags are saved lowercase", async () => {
  renderApp("/recipe/chicken-soup/edit");
  const tags = screen.getByLabelText("Tags", { selector: "input" });
  await userEvent.type(tags, "summ");
  expect(await screen.findByRole("option", { name: "summer" })).toBeInTheDocument();
  await userEvent.clear(tags);
  await userEvent.type(tags, "Dinner,");
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  expect(fake.updateRecipe).toHaveBeenCalledWith(
    "chicken-soup",
    expect.objectContaining({ tags: ["chicken", "soup", "dinner"] }),
  );
});

test("New recipe opens a blank form; saving creates the recipe and opens it", async () => {
  const { router } = renderApp("/?sort=az");
  await chooseFromMenu("New recipe");

  expect(router.state.location.pathname).toBe("/recipe/new");
  expect(screen.getByRole("heading", { name: "New recipe" })).toBeInTheDocument();
  expect(field("Title")).toHaveValue("");

  await userEvent.type(field("Title"), "Toast");
  await userEvent.type(field("Ingredients"), "2 slices bread");
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  expect(fake.createRecipe).toHaveBeenCalledWith(
    expect.objectContaining({
      title: "Toast",
      ingredients: [{ raw: "2 slices bread", qty: 2, unit: "slice", item: "bread" }],
    }),
  );
  expect(router.state.location.pathname).toBe("/recipe/NewRecipeId123");
});

test("a failed save says why and keeps the form", async () => {
  fake.updateRecipe.mockRejectedValue(new Error("Missing or insufficient permissions."));
  const { router } = renderApp("/recipe/chicken-soup/edit");
  await userEvent.type(field("Title"), "!");
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  expect(await screen.findByText("Missing or insufficient permissions.")).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/recipe/chicken-soup/edit");
  expect(field("Title")).toHaveValue("Chicken Soup!");
});
