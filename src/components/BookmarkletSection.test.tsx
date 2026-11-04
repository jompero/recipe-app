// The Data page's Recipe bookmarklet section (US-4.4, issue 07).
import userEvent from "@testing-library/user-event";
import { bookmarkletHref } from "../bookmarklet/bookmarklet.ts";
import { render, screen } from "../test-utils/render.tsx";
import { BookmarkletSection } from "./BookmarkletSection.tsx";

const appUrl = window.location.origin + window.location.pathname;

test("the draggable link carries the bookmarklet for this app's address", () => {
  render(<BookmarkletSection />);

  const link = screen.getByRole("link", { name: "Recipe bookmarklet" });
  const href = link.getAttribute("href") ?? "";
  // React 19 swaps a javascript: href prop for one that throws "React has blocked…".
  expect(href).toMatch(/^javascript:/);
  expect(href).not.toContain("React has blocked");
  expect(href).toContain(JSON.stringify(appUrl));
  expect(href).toBe(bookmarkletHref(appUrl));
  expect(screen.getByText("Drag this to your bookmarks bar")).toBeInTheDocument();
});

test("shows the code read-only, and Copy puts it on the clipboard", async () => {
  const user = userEvent.setup();
  render(<BookmarkletSection />);

  const code = screen.getByLabelText("Bookmarklet code");
  expect(code).toHaveValue(bookmarkletHref(appUrl));
  expect(code).toHaveAttribute("readonly");

  await user.click(screen.getByRole("button", { name: "Copy" }));

  expect(await navigator.clipboard.readText()).toBe(bookmarkletHref(appUrl));
  expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument();
});

test("has steps for each browser and the Safari note", () => {
  render(<BookmarkletSection />);

  for (const browser of ["Chrome, Firefox and Edge", "iPhone (Safari)", "Android (Chrome)"]) {
    expect(screen.getByText(browser)).toBeInTheDocument();
  }
  expect(
    screen.getByText("Safari (Mac and iPhone) can't run it on some sites. Use Paste recipe there."),
  ).toBeInTheDocument();
});
