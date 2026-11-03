import userEvent from "@testing-library/user-event";
import type { Mock } from "vitest";
import { App } from "./App.tsx";
import type { Session } from "./data/auth.ts";
import { render, screen } from "./test-utils/render.tsx";

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

// The Data page's database calls aren't under test here; faking the module also keeps the real
// Firebase setup (src/config/firebase.ts) from loading, which needs the .env config CI doesn't have.
vi.mock("./data/recipes.ts", () => ({
  existingRecipeIds: vi.fn(),
  saveRecipes: vi.fn(),
}));

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
  render(<App />);
  expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

test("signed out: offers Google sign-in", async () => {
  fakeAuth.session = { status: "signed-out" };
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));
  expect(fakeAuth.signIn).toHaveBeenCalledOnce();
});

test("signed out: shows the reason when sign-in fails", async () => {
  fakeAuth.session = { status: "signed-out" };
  fakeAuth.signIn.mockRejectedValue(new Error("Your browser blocked the sign-in window."));
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));
  expect(await screen.findByText("Your browser blocked the sign-in window.")).toBeInTheDocument();
});

test("non-member: says they're not on the list, shows their email, and can sign out", async () => {
  fakeAuth.session = { status: "non-member", user: ada };
  render(<App />);
  expect(screen.getByRole("heading", { name: "You're not on the list" })).toBeInTheDocument();
  expect(screen.getByText("ada@example.com")).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Cookbook" })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
  expect(fakeAuth.signOut).toHaveBeenCalledOnce();
});

test("membership check failed: explains it and offers sign-out", () => {
  fakeAuth.session = { status: "error", user: ada };
  render(<App />);
  expect(screen.getByRole("heading", { name: "Couldn't check your access" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
});

test("member: sees the app shell with their name, the home page, and sign-out", async () => {
  fakeAuth.session = { status: "member", user: ada };
  render(<App />, { route: "/" });
  expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Cookbook" })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
  expect(fakeAuth.signOut).toHaveBeenCalledOnce();
});

test("member: the home page links to the Data page", async () => {
  fakeAuth.session = { status: "member", user: ada };
  render(<App />, { route: "/" });
  await userEvent.click(screen.getByRole("link", { name: "Data" }));
  expect(screen.getByRole("heading", { name: "Data" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Import from Pepperplate" })).toBeInTheDocument();
});
