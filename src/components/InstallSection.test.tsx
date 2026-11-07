import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { theme } from "../theme.ts";
import { InstallSection } from "./InstallSection.tsx";

/** Makes `(display-mode: standalone)` match or not; other queries never match. */
function displayMode(standalone: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: standalone && query === "(display-mode: standalone)",
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
}

const renderSection = () =>
  render(
    <MantineProvider theme={theme}>
      <InstallSection />
    </MantineProvider>,
  );

afterEach(() => {
  vi.restoreAllMocks();
  delete (navigator as Navigator & { standalone?: boolean }).standalone;
});

test("in a browser tab, shows how to install, including signing in once more", () => {
  displayMode(false);
  renderSection();
  expect(screen.getByRole("heading", { name: "Install on your phone" })).toBeInTheDocument();
  expect(screen.getByText(/Add to Home Screen/)).toBeInTheDocument();
  expect(screen.getByText(/Sign in once more/)).toBeInTheDocument();
});

test("hidden in the installed app", () => {
  displayMode(true);
  renderSection();
  expect(screen.queryByRole("heading", { name: "Install on your phone" })).not.toBeInTheDocument();
});

test("hidden in the installed app on iOS's older check too", () => {
  displayMode(false);
  Object.defineProperty(navigator, "standalone", { value: true, configurable: true });
  renderSection();
  expect(screen.queryByRole("heading", { name: "Install on your phone" })).not.toBeInTheDocument();
});
