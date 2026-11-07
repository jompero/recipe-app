import userEvent from "@testing-library/user-event";
import { within } from "@testing-library/react";
import type { RecipeToSave } from "../data/recipes.ts";
import { render, screen } from "../test-utils/render.tsx";
import type { CompressedImage } from "../utils/imageCompressor.ts";
import { DataPage } from "./DataPage.tsx";

// Fake the seams: the database module and the canvas-based compressor (jsdom has no canvas).
const fakes = vi.hoisted(() => ({
  existingRecipeIds: vi.fn<(ids: string[]) => Promise<string[]>>(),
  saveRecipes:
    vi.fn<
      (
        recipes: RecipeToSave[],
        onProgress?: (saved: number, total: number) => void,
      ) => Promise<void>
    >(),
  compressImage: vi.fn<(file: File) => Promise<CompressedImage>>(),
}));

vi.mock("../data/recipes.ts", () => ({
  existingRecipeIds: fakes.existingRecipeIds,
  saveRecipes: fakes.saveRecipes,
}));
vi.mock("../utils/imageCompressor.ts", () => ({ compressImage: fakes.compressImage }));
// Export and restore are tested in DataPageBackup.test.tsx.
vi.mock("../data/backup.ts", () => ({ exportEverything: vi.fn(), restoreEverything: vi.fn() }));

function pepperplate(title: string, ingredients: string[], steps: string[]): string {
  return [
    `Title: ${title}`,
    "Ingredients:",
    ...ingredients.map((line) => `\t${line}`),
    "",
    "Instructions:",
    ...steps.map((line) => `\t${line}`),
    "",
  ].join("\r\n");
}

const recipeFiles = [
  new File([pepperplate("Pasta Bake", ["400 g pasta", "Salt"], ["Bake."])], "PastaBake.txt"),
  new File([pepperplate("Soup", ["1 l water"], [])], "Soup.txt"),
];
const photoFiles = [new File(["jpeg bytes"], "PastaBake.jpg", { type: "image/jpeg" })];

beforeEach(() => {
  fakes.existingRecipeIds.mockReset().mockResolvedValue([]);
  fakes.saveRecipes.mockReset().mockImplementation((recipes, onProgress) => {
    onProgress?.(recipes.length, recipes.length);
    return Promise.resolve();
  });
  fakes.compressImage
    .mockReset()
    .mockImplementation((file) =>
      Promise.resolve({ full: `full:${file.name}`, thumbnail: `thumb:${file.name}` }),
    );
});

async function pickFolders() {
  const user = userEvent.setup();
  render(<DataPage />);
  await user.upload(screen.getByLabelText("Recipe folder"), recipeFiles);
  await user.upload(screen.getByLabelText("Photo folder"), photoFiles);
  return user;
}

test("previews the picked recipes: totals and the ones with warnings", async () => {
  await pickFolders();

  expect(await screen.findByText("2 recipes, 1 with a photo")).toBeInTheDocument();
  expect(screen.getByText("1 of 3 ingredient lines have no amount")).toBeInTheDocument();
  const warnings = screen.getByRole("region", { name: "Recipes to check" });
  expect(within(warnings).getByText("Soup")).toBeInTheDocument();
  expect(within(warnings).getByText("No photo")).toBeInTheDocument();
  expect(within(warnings).getByText("No instructions")).toBeInTheDocument();
  expect(within(warnings).queryByText("Pasta Bake")).not.toBeInTheDocument();
});

test("tapping a recipe with warnings shows what was parsed", async () => {
  const user = await pickFolders();

  await user.click(await screen.findByRole("button", { name: /Soup/ }));

  expect(await screen.findByText("1 l water")).toBeInTheDocument();
  expect(screen.getByText("1 · l · water")).toBeInTheDocument();
});

test("imports every recipe with its compressed photo and reports when done", async () => {
  const user = await pickFolders();

  await user.click(await screen.findByRole("button", { name: "Import 2 recipes" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).queryByText(/will be replaced/)).not.toBeInTheDocument();
  await user.click(within(dialog).getByRole("button", { name: "Import" }));

  expect(await screen.findByText("Imported 2 recipes, 1 with a photo.")).toBeInTheDocument();
  expect(fakes.compressImage).toHaveBeenCalledOnce();
  expect(fakes.compressImage.mock.calls[0]?.[0].name).toBe("PastaBake.jpg");
  const saved = fakes.saveRecipes.mock.calls[0]?.[0];
  expect(saved?.map(({ id, thumbnail, fullImage }) => ({ id, thumbnail, fullImage }))).toEqual([
    { id: "pasta-bake", thumbnail: "thumb:PastaBake.jpg", fullImage: "full:PastaBake.jpg" },
    { id: "soup", thumbnail: null, fullImage: null },
  ]);
  expect(saved?.[0]?.recipe.title).toBe("Pasta Bake");
});

test("warns before replacing recipes that already exist, and Cancel saves nothing", async () => {
  fakes.existingRecipeIds.mockResolvedValue(["soup"]);
  const user = await pickFolders();

  await user.click(await screen.findByRole("button", { name: "Import 2 recipes" }));
  const dialog = await screen.findByRole("dialog");
  expect(
    within(dialog).getByText(
      "1 recipe already exists and will be replaced; your edits to it will be lost.",
    ),
  ).toBeInTheDocument();
  expect(fakes.existingRecipeIds).toHaveBeenCalledWith(["pasta-bake", "soup"]);
  await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

  expect(fakes.saveRecipes).not.toHaveBeenCalled();
});

test("shows progress while compressing and saving", async () => {
  let finishSaving = () => {};
  fakes.saveRecipes.mockImplementation(
    (recipes, onProgress) =>
      new Promise((resolve) => {
        onProgress?.(1, recipes.length);
        finishSaving = () => resolve();
      }),
  );
  const user = await pickFolders();

  await user.click(await screen.findByRole("button", { name: "Import 2 recipes" }));
  await user.click(
    within(await screen.findByRole("dialog")).getByRole("button", { name: "Import" }),
  );

  expect(await screen.findByText("Saving recipes: 1 of 2")).toBeInTheDocument();
  finishSaving();
  expect(await screen.findByText("Imported 2 recipes, 1 with a photo.")).toBeInTheDocument();
});

test("a photo that can't be compressed is skipped, not fatal", async () => {
  fakes.compressImage.mockRejectedValue(new Error("PastaBake.jpg is still over 900 KB."));
  const user = await pickFolders();

  await user.click(await screen.findByRole("button", { name: "Import 2 recipes" }));
  await user.click(
    within(await screen.findByRole("dialog")).getByRole("button", { name: "Import" }),
  );

  expect(await screen.findByText("Imported 2 recipes, 0 with a photo.")).toBeInTheDocument();
  expect(
    screen.getByText("PastaBake.jpg: PastaBake.jpg is still over 900 KB."),
  ).toBeInTheDocument();
  expect(fakes.saveRecipes.mock.calls[0]?.[0][0]).toMatchObject({
    thumbnail: null,
    fullImage: null,
  });
});

test("a failed save shows the error and lets you try again", async () => {
  fakes.saveRecipes.mockRejectedValueOnce(new Error("Missing or insufficient permissions."));
  const user = await pickFolders();

  await user.click(await screen.findByRole("button", { name: "Import 2 recipes" }));
  await user.click(
    within(await screen.findByRole("dialog")).getByRole("button", { name: "Import" }),
  );

  expect(
    await screen.findByText("Import failed: Missing or insufficient permissions."),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Import 2 recipes" })).toBeInTheDocument();
});

test("while the phone says it's offline, the import is disabled with a note", async () => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
  await pickFolders();

  expect(await screen.findByRole("button", { name: "Import 2 recipes" })).toBeDisabled();
  expect(screen.getAllByText("Needs a connection").length).toBeGreaterThan(0);
  vi.restoreAllMocks();
});
