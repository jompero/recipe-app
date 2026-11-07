import { act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Session } from "../data/auth.ts";
import type { PhotoChange, RecipePhoto, StoredRecipe } from "../data/recipes.ts";
import { encodePayload } from "../import/payloadCodec.ts";
import type { RecipeDraft } from "../parsing/types.ts";
import { storedRecipe } from "../test-utils/recipeFixture.ts";
import { renderApp, screen } from "../test-utils/renderApp.tsx";
import type { CompressedImage } from "../utils/imageCompressor.ts";

// Fake the seams: the session (tests can change it), the live recipe list, the saves and the
// compressor (jsdom has no canvas). `fetch` is stubbed per test.
const fake = vi.hoisted(() => ({
  session: { status: "member" } as Session,
  emitSession: null as ((session: Session) => void) | null,
  emitRecipes: null as ((recipes: StoredRecipe[]) => void) | null,
  recipes: [] as StoredRecipe[],
  createRecipe: vi.fn<(recipe: RecipeDraft, photo?: RecipePhoto | null) => Promise<string>>(),
  compressImage: vi.fn<(file: File) => Promise<CompressedImage>>(),
}));
vi.mock("../utils/imageCompressor.ts", () => ({
  compressImage: fake.compressImage,
  ImageTooLargeError: class extends Error {},
}));
vi.mock("../data/recipes.ts", () => ({
  watchRecipes: (onChange: (recipes: StoredRecipe[]) => void) => {
    fake.emitRecipes = onChange;
    onChange(fake.recipes);
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
vi.mock("../data/groceries.ts", () => ({ watchGroceryList: () => () => {} }));
vi.mock("../data/menu.ts", () => ({ watchDays: () => () => {} }));
vi.mock("../data/auth.ts", () => ({
  watchSession: (onChange: (session: Session) => void) => {
    fake.emitSession = onChange;
    onChange(fake.session);
    return () => {};
  },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

const ada = { name: "Ada", email: "ada@example.com", photoUrl: null };
const PHOTO_URL = "https://images.example.com/aebleskiver.jpg";
const PAGE_URL = "https://www.example.com/aebleskiver/?utm_source=share";

/** What the bookmarklet sends from a recipe page. */
const GOOD_D = encodePayload({
  v: 1,
  url: PAGE_URL,
  recipe: {
    name: "Æbleskiver",
    publisher: { name: "Køkkenet" },
    image: PHOTO_URL,
    recipeYield: ["4", "4 personer"],
    recipeIngredient: ["250 g hvedemel", "3 æg"],
    recipeInstructions: [{ "@type": "HowToStep", text: "Pisk det hele sammen." }],
  },
});
/** The same recipe without a photo, for tests that aren't about it. */
const NO_PHOTO_D = encodePayload({
  v: 1,
  url: PAGE_URL,
  recipe: { name: "Æbleskiver", recipeIngredient: ["3 æg"] },
});

const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>();
const field = (name: string) => screen.getByRole("textbox", { name });
const imageResponse = () =>
  ({
    ok: true,
    blob: () => Promise.resolve(new Blob(["jpeg"], { type: "image/jpeg" })),
  }) as Response;

beforeEach(() => {
  sessionStorage.clear();
  fake.session = { status: "member", user: ada };
  fake.recipes = [];
  fake.createRecipe.mockReset().mockResolvedValue("NewRecipeId123");
  fake.compressImage.mockReset().mockResolvedValue({
    thumbnail: "data:image/jpeg;base64,dGh1bWI=",
    full: "data:image/jpeg;base64,ZnVsbA==",
  });
  fetchMock.mockReset().mockRejectedValue(new TypeError("Failed to fetch"));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the import route", () => {
  test("good data opens the New recipe form filled in, and the import URL is replaced", async () => {
    const { router } = renderApp(`/import?d=${GOOD_D}`);

    expect(await screen.findByRole("heading", { name: "New recipe" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/recipe/new");
    expect(router.state.location.search).toBe("");
    expect(field("Title")).toHaveValue("Æbleskiver");
    expect(field("Source")).toHaveValue("Køkkenet");
    expect(field("Source URL")).toHaveValue(PAGE_URL);
    expect(field("Yield")).toHaveValue("4 personer");
    expect(field("Ingredients")).toHaveValue("250 g hvedemel\n3 æg");
    expect(field("Method")).toHaveValue("Pisk det hele sammen.");
  });

  test("Back asks to discard, then lands in the cookbook: the import URL is gone from history", async () => {
    const { router, back } = renderApp(`/import?d=${NO_PHOTO_D}`);
    await screen.findByRole("heading", { name: "New recipe" });

    await back();
    const prompt = await screen.findByRole("dialog", { name: "Discard changes?" });
    await userEvent.click(within(prompt).getByRole("button", { name: "Discard" }));

    expect(router.state.location.pathname).toBe("/");
    expect(router.state.location.search).toBe("");
    expect(await screen.findByRole("heading", { name: "Cookbook" })).toBeInTheDocument();
  });

  test("Cancel on the filled-in form asks too, then goes to the cookbook", async () => {
    const { router } = renderApp(`/import?d=${NO_PHOTO_D}`);
    await screen.findByRole("heading", { name: "New recipe" });

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    const prompt = await screen.findByRole("dialog", { name: "Discard changes?" });
    await userEvent.click(within(prompt).getByRole("button", { name: "Discard" }));
    expect(router.state.location.pathname).toBe("/");
  });

  test("bad data says it couldn't read the recipe, drops it from the URL, and links to the cookbook", async () => {
    const { router } = renderApp("/import?d=not*base64");

    expect(
      await screen.findByRole("heading", { name: "Couldn't read that recipe" }),
    ).toBeInTheDocument();
    expect(router.state.location.search).toBe("");
    expect(sessionStorage.length).toBe(0);

    await userEvent.click(screen.getByRole("link", { name: "Go to the cookbook" }));
    expect(router.state.location.pathname).toBe("/");
  });

  test("signed out: the data waits through sign-in, then the draft opens", async () => {
    fake.session = { status: "signed-out" };
    const { router } = renderApp(`/import?d=${NO_PHOTO_D}`);
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeInTheDocument();
    expect(sessionStorage.getItem("import.d")).toBe(NO_PHOTO_D);

    act(() => fake.emitSession?.({ status: "member", user: ada }));

    expect(await screen.findByRole("heading", { name: "New recipe" })).toBeInTheDocument();
    expect(field("Title")).toHaveValue("Æbleskiver");
    expect(router.state.location.pathname).toBe("/recipe/new");
    expect(sessionStorage.getItem("import.d")).toBeNull();
  });

  test("the kept data opens the draft even if the URL lost it", async () => {
    sessionStorage.setItem("import.d", NO_PHOTO_D);
    renderApp("/import");

    expect(await screen.findByRole("heading", { name: "New recipe" })).toBeInTheDocument();
    expect(field("Title")).toHaveValue("Æbleskiver");
    expect(sessionStorage.getItem("import.d")).toBeNull();
  });
});

describe("the site's photo", () => {
  test("a fetch the site doesn't allow shows how to copy and paste it instead", async () => {
    renderApp(`/import?d=${GOOD_D}`);

    expect(
      await screen.findByText(
        "Couldn't fetch the photo: copy the image on the site and paste it here",
      ),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(PHOTO_URL, expect.anything());
    const link = screen.getByRole("link", { name: "Open the image" });
    expect(link).toHaveAttribute("href", PHOTO_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(fake.compressImage).not.toHaveBeenCalled();
  });

  test("while the phone says it's offline, the fallback says it needs a connection", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    renderApp(`/import?d=${GOOD_D}`);

    expect(
      await screen.findByText(
        "Needs a connection to fetch the site's photo. Paste one here, or add it later.",
      ),
    ).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  test("an error response or something that isn't an image shows the fallback too", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404 } as Response);
    const first = renderApp(`/import?d=${GOOD_D}`);
    expect(await screen.findByRole("link", { name: "Open the image" })).toBeInTheDocument();
    first.unmount();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(new Blob(["<html>"], { type: "text/html" })),
    } as Response);
    renderApp(`/import?d=${GOOD_D}`);
    expect(await screen.findByRole("link", { name: "Open the image" })).toBeInTheDocument();
    expect(fake.compressImage).not.toHaveBeenCalled();
  });

  test("a fetch that works stages the photo, and Save sends it with the recipe", async () => {
    fetchMock.mockResolvedValue(imageResponse());
    renderApp(`/import?d=${GOOD_D}`);

    const preview = await screen.findByRole("img", { name: "Recipe photo" });
    expect(preview).toHaveAttribute("src", "data:image/jpeg;base64,ZnVsbA==");
    expect(fake.compressImage).toHaveBeenCalledOnce();
    expect(screen.queryByRole("link", { name: "Open the image" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(fake.createRecipe).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Æbleskiver" }),
      {
        thumbnail: "data:image/jpeg;base64,dGh1bWI=",
        full: "data:image/jpeg;base64,ZnVsbA==",
      },
    );
  });

  test("no photo URL, no fetch", async () => {
    renderApp(`/import?d=${NO_PHOTO_D}`);
    await screen.findByRole("heading", { name: "New recipe" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("the duplicate notice", () => {
  const notice = () => screen.queryByText("You already have this recipe");

  test("shows for a recipe from the same address, archived ones included, and doesn't block saving", async () => {
    fake.recipes = [
      storedRecipe("Grandma's Æbleskiver", {
        sourceUrl: "http://example.com/aebleskiver",
        archived: true,
      }),
    ];
    const { router } = renderApp(`/import?d=${NO_PHOTO_D}`);
    await screen.findByRole("heading", { name: "New recipe" });

    expect(notice()).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Grandma's Æbleskiver/ });
    expect(link).toHaveAttribute("href", "/recipe/grandma-s-bleskiver");

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(fake.createRecipe).toHaveBeenCalledOnce();
    expect(router.state.location.pathname).toBe("/recipe/NewRecipeId123");
  });

  test("shows when a source URL is typed into a Quick Paste draft, and goes when it no longer matches", async () => {
    fake.recipes = [storedRecipe("Pancakes", { sourceUrl: "https://www.example.com/pancakes/" })];
    renderApp("/paste");
    await userEvent.click(screen.getByRole("textbox", { name: "Recipe text" }));
    await userEvent.paste("Pancakes\nIngredients\n3 eggs");
    await userEvent.click(screen.getByRole("button", { name: "Make draft" }));
    expect(notice()).not.toBeInTheDocument();

    await userEvent.type(field("Source URL"), "example.com/pancakes");
    expect(notice()).toBeInTheDocument();
    expect(
      within(screen.getByRole("alert")).getByRole("link", { name: /Pancakes/ }),
    ).toBeInTheDocument();

    await userEvent.type(field("Source URL"), "-2");
    expect(notice()).not.toBeInTheDocument();
  });

  test("the recipe being saved doesn't count as a duplicate of itself", async () => {
    // Firestore lists a write before the server confirms it, so the new recipe shows up in the
    // live list while Save is still waiting.
    fake.createRecipe.mockReturnValue(new Promise(() => {}));
    renderApp(`/import?d=${NO_PHOTO_D}`);
    await screen.findByRole("heading", { name: "New recipe" });

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    act(() =>
      fake.emitRecipes?.([
        storedRecipe("Æbleskiver", { sourceUrl: "https://example.com/aebleskiver" }),
      ]),
    );
    expect(notice()).not.toBeInTheDocument();
  });

  test("a recipe doesn't count as its own duplicate", async () => {
    fake.recipes = [storedRecipe("Pancakes", { sourceUrl: "https://example.com/pancakes" })];
    renderApp("/recipe/pancakes/edit");
    await screen.findByRole("heading", { name: "Edit recipe" });
    expect(field("Source URL")).toHaveValue("https://example.com/pancakes");
    expect(notice()).not.toBeInTheDocument();
  });
});
