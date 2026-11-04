import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Session } from "../data/auth.ts";
import type { PhotoChange, RecipePhoto, StoredRecipe } from "../data/recipes.ts";
import type { RecipeDraft } from "../parsing/types.ts";
import { renderApp, screen } from "../test-utils/renderApp.tsx";

// Fake the seams: a member, an empty live recipe list and the saves. The compressor is faked
// because the edit form's photo field imports it (jsdom has no canvas).
const fake = vi.hoisted(() => ({
  createRecipe: vi.fn<(recipe: RecipeDraft, photo?: RecipePhoto | null) => Promise<string>>(),
}));
vi.mock("../utils/imageCompressor.ts", () => ({
  compressImage: vi.fn(),
  ImageTooLargeError: class extends Error {},
}));
vi.mock("../data/recipes.ts", () => ({
  watchRecipes: (onChange: (recipes: StoredRecipe[]) => void) => {
    onChange([]);
    return () => {};
  },
  updateRecipe: vi.fn<(id: string, recipe: RecipeDraft, photo?: PhotoChange) => Promise<void>>(),
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

const PANCAKES = [
  "Pancakes",
  "Thin and lacy.",
  "Serves 4",
  "",
  "Ingredients:",
  "• 200 g flour",
  "• 3 eggs",
  "",
  "Method",
  "1. Whisk everything together.",
  "2. Fry in butter.",
].join("\n");

beforeEach(() => {
  sessionStorage.clear();
  fake.createRecipe.mockReset().mockResolvedValue("NewRecipeId123");
});

const field = (name: string) => screen.getByRole("textbox", { name });
const pasteBox = () => screen.getByRole("textbox", { name: "Recipe text" });
const makeDraft = () => screen.getByRole("button", { name: "Make draft" });

async function chooseFromMenu(action: string) {
  await userEvent.click(screen.getByRole("button", { name: "Menu" }));
  const menu = await screen.findByRole("dialog", { name: "Menu" });
  await userEvent.click(within(menu).getByRole("button", { name: action }));
}

/** From the cookbook, through the overlay, to the paste page, then a draft from PANCAKES. */
async function pasteAndMakeDraft() {
  const result = renderApp("/?sort=az");
  await chooseFromMenu("Paste recipe");
  await userEvent.click(pasteBox());
  await userEvent.paste(PANCAKES);
  await userEvent.click(makeDraft());
  return result;
}

test("the cookbook's menu lists Paste recipe next to New recipe, and it opens the paste page", async () => {
  const { router } = renderApp("/?sort=az");
  await userEvent.click(screen.getByRole("button", { name: "Menu" }));
  const menu = await screen.findByRole("dialog", { name: "Menu" });
  const actions = within(menu)
    .getAllByRole("button")
    .map((button) => button.textContent);
  expect(actions.indexOf("Paste recipe")).toBe(actions.indexOf("New recipe") + 1);

  await userEvent.click(within(menu).getByRole("button", { name: "Paste recipe" }));
  expect(router.state.location.pathname).toBe("/paste");
  expect(screen.getByRole("heading", { name: "Paste recipe" })).toBeInTheDocument();
});

test("Make draft is disabled until there is text", async () => {
  renderApp("/paste");
  expect(makeDraft()).toBeDisabled();
  await userEvent.type(pasteBox(), "   ");
  expect(makeDraft()).toBeDisabled();
  await userEvent.type(pasteBox(), "Toast");
  expect(makeDraft()).toBeEnabled();
});

test("paste, then Make draft: the New recipe form opens filled in", async () => {
  const { router } = await pasteAndMakeDraft();

  expect(router.state.location.pathname).toBe("/recipe/new");
  expect(screen.getByRole("heading", { name: "New recipe" })).toBeInTheDocument();
  expect(field("Title")).toHaveValue("Pancakes");
  expect(field("Description")).toHaveValue("Thin and lacy.");
  expect(field("Yield")).toHaveValue("4");
  expect(field("Ingredients")).toHaveValue("200 g flour\n3 eggs");
  expect(field("Method")).toHaveValue("Whisk everything together.\nFry in butter.");
});

test("Cancel on the filled-in form asks to discard, even untouched", async () => {
  const { router } = await pasteAndMakeDraft();

  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  const prompt = await screen.findByRole("dialog", { name: "Discard changes?" });
  await userEvent.click(within(prompt).getByRole("button", { name: "Keep editing" }));
  expect(router.state.location.pathname).toBe("/recipe/new");
  expect(field("Title")).toHaveValue("Pancakes");

  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  await userEvent.click(
    within(await screen.findByRole("dialog", { name: "Discard changes?" })).getByRole("button", {
      name: "Discard",
    }),
  );
  expect(router.state.location.pathname).toBe("/paste");
  expect(pasteBox()).toHaveValue(PANCAKES);
  expect(fake.createRecipe).not.toHaveBeenCalled();
});

test("phone Back from the form asks, then returns to the paste page with the text", async () => {
  const { router, back } = await pasteAndMakeDraft();

  await back();
  const prompt = await screen.findByRole("dialog", { name: "Discard changes?" });
  await userEvent.click(within(prompt).getByRole("button", { name: "Discard" }));

  expect(router.state.location.pathname).toBe("/paste");
  expect(pasteBox()).toHaveValue(PANCAKES);
});

test("saving creates the recipe from the draft and clears the pasted text", async () => {
  const { router, back } = await pasteAndMakeDraft();
  await userEvent.type(field("Title"), " for two");
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  expect(fake.createRecipe).toHaveBeenCalledWith(
    expect.objectContaining({
      title: "Pancakes for two",
      yield: "4",
      ingredients: [
        { raw: "200 g flour", qty: 200, unit: "g", item: "flour" },
        { raw: "3 eggs", qty: 3, item: "eggs" },
      ],
      instructions: [{ text: "Whisk everything together." }, { text: "Fry in butter." }],
    }),
    null,
  );
  expect(router.state.location.pathname).toBe("/recipe/NewRecipeId123");

  // Back from the new recipe lands on the paste page, empty and ready for the next one.
  await back();
  expect(router.state.location.pathname).toBe("/paste");
  expect(pasteBox()).toHaveValue("");
});

test("New recipe without a draft still opens a blank form that leaves without asking", async () => {
  const { router } = renderApp("/?sort=az");
  await chooseFromMenu("New recipe");
  expect(field("Title")).toHaveValue("");

  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("dialog", { name: "Discard changes?" })).not.toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/");
});
