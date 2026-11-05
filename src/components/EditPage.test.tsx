import { fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Session } from "../data/auth.ts";
import type { PhotoChange, RecipePhoto, StoredRecipe } from "../data/recipes.ts";
import type { RecipeDraft } from "../parsing/types.ts";
import { storedRecipe } from "../test-utils/recipeFixture.ts";
import { renderApp, screen } from "../test-utils/renderApp.tsx";
import type { CompressedImage } from "../utils/imageCompressor.ts";

// Fake the seams: a member, the live recipe list, the two saves, and the canvas-based compressor
// (jsdom has no canvas).
const fake = vi.hoisted(() => ({
  recipes: [] as StoredRecipe[],
  updateRecipe: vi.fn<(id: string, recipe: RecipeDraft, photo?: PhotoChange) => Promise<void>>(),
  createRecipe: vi.fn<(recipe: RecipeDraft, photo?: RecipePhoto | null) => Promise<string>>(),
  compressImage: vi.fn<(file: File) => Promise<CompressedImage>>(),
  ImageTooLargeError: class extends Error {},
}));
vi.mock("../utils/imageCompressor.ts", () => ({
  compressImage: fake.compressImage,
  ImageTooLargeError: fake.ImageTooLargeError,
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
vi.mock("../data/menu.ts", () => ({ watchDays: () => () => {} }));
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
  fake.compressImage
    .mockReset()
    .mockImplementation((file) =>
      Promise.resolve({ full: `full:${file.name}`, thumbnail: `thumb:${file.name}` }),
    );
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
    "keep",
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
    "keep",
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
    null,
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

describe("photo (US-4.1)", () => {
  const dish = () => new File(["jpeg bytes"], "dish.jpg", { type: "image/jpeg" });
  const photoArea = () => screen.getByRole("group", { name: "Photo" });
  const preview = () => screen.getByRole("img", { name: "Recipe photo" });

  beforeEach(() => {
    fake.recipes = [{ ...soup, thumbnail: "data:image/jpeg;base64,THUMB", hasImage: true }];
  });

  test("an existing photo shows, and a recipe without one shows a placeholder", async () => {
    renderApp("/recipe/chicken-soup/edit");
    expect(preview()).toHaveAttribute("src", "data:image/jpeg;base64,THUMB");

    fake.recipes = [];
    renderApp("/recipe/new");
    expect(await screen.findByText(/No photo/)).toBeInTheDocument();
  });

  test("picking a file compresses it and shows the preview", async () => {
    renderApp("/recipe/chicken-soup/edit");
    const picker = screen.getByLabelText("Choose a photo");
    expect(picker).toHaveAttribute("accept", "image/*");
    expect(picker).not.toHaveAttribute("capture");

    await userEvent.upload(picker, dish());

    expect(fake.compressImage).toHaveBeenCalledWith(expect.objectContaining({ name: "dish.jpg" }));
    expect(await screen.findByRole("img", { name: "Recipe photo" })).toHaveAttribute(
      "src",
      "full:dish.jpg",
    );
  });

  test("pasting an image anywhere outside the text boxes stages it", async () => {
    renderApp("/recipe/chicken-soup/edit");

    fireEvent.paste(document.body, { clipboardData: { files: [dish()], items: [] } });

    expect(await screen.findByRole("img", { name: "Recipe photo" })).toHaveAttribute(
      "src",
      "full:dish.jpg",
    );
  });

  test("pasting an image given only as a clipboard item stages it", async () => {
    renderApp("/recipe/chicken-soup/edit");
    const item = { kind: "file", type: "image/png", getAsFile: () => dish() };

    fireEvent.paste(photoArea(), { clipboardData: { files: [], items: [item] } });

    expect(await screen.findByRole("img", { name: "Recipe photo" })).toHaveAttribute(
      "src",
      "full:dish.jpg",
    );
  });

  test("pasting into a text box is left to the text box", () => {
    renderApp("/recipe/chicken-soup/edit");

    fireEvent.paste(field("Method"), { clipboardData: { files: [dish()], items: [] } });

    expect(fake.compressImage).not.toHaveBeenCalled();
  });

  test("dropping an image file on the photo area stages it", async () => {
    renderApp("/recipe/chicken-soup/edit");

    fireEvent.drop(photoArea(), { dataTransfer: { files: [dish()], types: ["Files"] } });

    expect(await screen.findByRole("img", { name: "Recipe photo" })).toHaveAttribute(
      "src",
      "full:dish.jpg",
    );
  });

  test("dropping a file that isn't an image says so and keeps the photo", async () => {
    renderApp("/recipe/chicken-soup/edit");
    const notes = new File(["text"], "notes.txt", { type: "text/plain" });

    fireEvent.drop(photoArea(), { dataTransfer: { files: [notes], types: ["Files"] } });

    expect(await screen.findByText(/isn't an image/)).toBeInTheDocument();
    expect(fake.compressImage).not.toHaveBeenCalled();
    expect(preview()).toHaveAttribute("src", "data:image/jpeg;base64,THUMB");
  });

  test("a photo too large to store shows an error and keeps the previous photo", async () => {
    fake.compressImage.mockRejectedValue(new fake.ImageTooLargeError("too big"));
    renderApp("/recipe/chicken-soup/edit");

    await userEvent.upload(screen.getByLabelText("Choose a photo"), dish());

    expect(await screen.findByText(/too large/)).toBeInTheDocument();
    expect(preview()).toHaveAttribute("src", "data:image/jpeg;base64,THUMB");
  });

  test("Remove clears the photo, and Save removes it", async () => {
    renderApp("/recipe/chicken-soup/edit");

    await userEvent.click(screen.getByRole("button", { name: "Remove photo" }));
    expect(screen.queryByRole("img", { name: "Recipe photo" })).not.toBeInTheDocument();
    expect(screen.getByText(/No photo/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(fake.updateRecipe).toHaveBeenCalledWith("chicken-soup", expect.anything(), "remove");
  });

  test("Save sends a new photo for an existing recipe", async () => {
    renderApp("/recipe/chicken-soup/edit");
    await userEvent.upload(screen.getByLabelText("Choose a photo"), dish());
    await screen.findByRole("img", { name: "Recipe photo" });

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(fake.updateRecipe).toHaveBeenCalledWith("chicken-soup", expect.anything(), {
      thumbnail: "thumb:dish.jpg",
      full: "full:dish.jpg",
    });
  });

  test("Save sends the photo with a new recipe", async () => {
    const { router } = renderApp("/recipe/new");
    await userEvent.type(field("Title"), "Toast");
    await userEvent.upload(screen.getByLabelText("Choose a photo"), dish());
    await screen.findByRole("img", { name: "Recipe photo" });

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(fake.createRecipe).toHaveBeenCalledWith(expect.objectContaining({ title: "Toast" }), {
      thumbnail: "thumb:dish.jpg",
      full: "full:dish.jpg",
    });
    expect(router.state.location.pathname).toBe("/recipe/NewRecipeId123");
  });

  test("Cancel after changing the photo asks to discard, and Discard saves nothing", async () => {
    const { router } = renderApp("/recipe/chicken-soup");
    await chooseFromMenu("Edit recipe");
    await userEvent.upload(screen.getByLabelText("Choose a photo"), dish());
    await screen.findByRole("img", { name: "Recipe photo" });

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    const prompt = await screen.findByRole("dialog", { name: "Discard changes?" });
    await userEvent.click(within(prompt).getByRole("button", { name: "Discard" }));

    expect(router.state.location.pathname).toBe("/recipe/chicken-soup");
    expect(fake.updateRecipe).not.toHaveBeenCalled();
  });

  test("Cancel after removing the photo asks to discard too", async () => {
    renderApp("/recipe/chicken-soup");
    await chooseFromMenu("Edit recipe");
    await userEvent.click(screen.getByRole("button", { name: "Remove photo" }));

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(await screen.findByRole("dialog", { name: "Discard changes?" })).toBeInTheDocument();
  });
});
