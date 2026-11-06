import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Mock } from "vitest";
import type { Session } from "./data/auth.ts";
import { renderApp, screen } from "./test-utils/renderApp.tsx";

// Fake the data seam: the tests decide which session the app sees.
interface FakeAuth {
  session: Session;
  signIn: Mock<() => Promise<void>>;
  signOut: Mock<() => Promise<void>>;
}
const fakeAuth = vi.hoisted((): FakeAuth => ({
  session: { status: "loading" },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// The Data page's database calls (recipes, backup) aren't under test here. Faking those modules
// also keeps the real Firebase setup (src/config/firebase.ts) from loading, which needs the .env
// config CI doesn't have.
vi.mock("./data/recipes.ts", () => ({
  watchRecipes: (onChange: (recipes: never[]) => void) => {
    onChange([]);
    return () => {};
  },
  existingRecipeIds: vi.fn(),
  saveRecipes: vi.fn(),
}));
vi.mock("./data/images.ts", () => ({ loadFullImage: vi.fn(() => Promise.resolve(null)) }));
vi.mock("./data/backup.ts", () => ({ exportEverything: vi.fn(), restoreEverything: vi.fn() }));
vi.mock("./data/groceries.ts", () => ({ watchGroceryList: () => () => {} }));
vi.mock("./data/menu.ts", () => ({ watchDays: () => () => {} }));

vi.mock("./data/auth.ts", () => ({
  watchSession: (onChange: (session: Session) => void) => {
    onChange(fakeAuth.session);
    return () => {};
  },
  signIn: fakeAuth.signIn,
  signOut: fakeAuth.signOut,
}));

const ada = { name: "Ada Lovelace", email: "ada@example.com", photoUrl: null };

beforeEach(() => {
  fakeAuth.signIn.mockReset().mockResolvedValue(undefined);
  fakeAuth.signOut.mockReset().mockResolvedValue(undefined);
});

test("while the session is loading, shows only a loader", () => {
  fakeAuth.session = { status: "loading" };
  renderApp();
  expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

test("signed out: offers Google sign-in", async () => {
  fakeAuth.session = { status: "signed-out" };
  renderApp();
  await userEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));
  expect(fakeAuth.signIn).toHaveBeenCalledOnce();
});

test("signed out: shows the reason when sign-in fails", async () => {
  fakeAuth.session = { status: "signed-out" };
  fakeAuth.signIn.mockRejectedValue(new Error("Your browser blocked the sign-in window."));
  renderApp();
  await userEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));
  expect(await screen.findByText("Your browser blocked the sign-in window.")).toBeInTheDocument();
});

test("non-member: says they're not on the list, shows their email, and can sign out", async () => {
  fakeAuth.session = { status: "non-member", user: ada };
  renderApp();
  expect(screen.getByRole("heading", { name: "You're not on the list" })).toBeInTheDocument();
  expect(screen.getByText("ada@example.com")).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Cookbook" })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
  expect(fakeAuth.signOut).toHaveBeenCalledOnce();
});

test("membership check failed: explains it and offers sign-out", () => {
  fakeAuth.session = { status: "error", user: ada };
  renderApp();
  expect(screen.getByRole("heading", { name: "Couldn't check your access" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
});

describe("member shell: the bottom button and the menu overlay", () => {
  beforeEach(() => {
    fakeAuth.session = { status: "member", user: ada };
  });

  test("a fresh start at the cookbook opens on the menu, with Cookbook, Data and Account", async () => {
    renderApp("/");
    const menu = await screen.findByRole("dialog", { name: "Menu" });
    for (const section of ["Cookbook", "Data", "Account"]) {
      expect(within(menu).getByRole("button", { name: section })).toBeInTheDocument();
    }
  });

  test("a deep link opens without the menu; the bottom button opens it and Back closes it", async () => {
    const { back } = renderApp("/data");
    expect(screen.getByRole("heading", { name: "Data" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Menu" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(await screen.findByRole("dialog", { name: "Menu" })).toBeInTheDocument();

    await back();
    expect(screen.queryByRole("dialog", { name: "Menu" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Data" })).toBeInTheDocument();
  });

  test("choosing a section goes there and closes the menu; Back then returns to the page below", async () => {
    const { back } = renderApp("/");
    const menu = await screen.findByRole("dialog", { name: "Menu" });
    await userEvent.click(within(menu).getByRole("button", { name: "Data" }));
    expect(screen.queryByRole("dialog", { name: "Menu" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Data" })).toBeInTheDocument();

    await back();
    expect(screen.queryByRole("dialog", { name: "Menu" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cookbook" })).toBeInTheDocument();
  });

  test("choosing Cookbook from the start menu just closes it", async () => {
    renderApp("/");
    const menu = await screen.findByRole("dialog", { name: "Menu" });
    await userEvent.click(within(menu).getByRole("button", { name: "Cookbook" }));
    expect(screen.queryByRole("dialog", { name: "Menu" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cookbook" })).toBeInTheDocument();
  });

  test("the menu lists the current page's actions first; choosing one goes there", async () => {
    const { router } = renderApp("/");
    const menu = await screen.findByRole("dialog", { name: "Menu" });
    expect(within(menu).getByRole("button", { name: "New recipe" })).toBeInTheDocument();
    await userEvent.click(within(menu).getByRole("button", { name: "Show archived" }));
    expect(screen.queryByRole("dialog", { name: "Menu" })).not.toBeInTheDocument();
    expect(router.state.location.search).toBe("?archived=1");
  });

  test("a page without actions shows only the sections", async () => {
    renderApp("/data");
    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    const menu = await screen.findByRole("dialog", { name: "Menu" });
    expect(within(menu).queryByRole("button", { name: "New recipe" })).not.toBeInTheDocument();
    expect(within(menu).getByRole("button", { name: "Account" })).toBeInTheDocument();
  });

  test("the Account page shows who you're signed in as and signs out", async () => {
    renderApp("/account");
    expect(screen.getByRole("heading", { name: "Account" })).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(fakeAuth.signOut).toHaveBeenCalledOnce();
  });

  test("the menu names the page you're on, also on pages without actions", async () => {
    for (const [route, name] of [
      ["/data", "Data"],
      ["/account", "Account"],
    ]) {
      const { unmount } = renderApp(route);
      await userEvent.click(screen.getByRole("button", { name: "Menu" }));
      const menu = await screen.findByRole("dialog", { name: "Menu" });
      expect(within(menu).getByRole("heading", { name })).toBeInTheDocument();
      unmount();
    }
  });
});
