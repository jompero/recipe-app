import { MantineProvider } from "@mantine/core";
import { render as testingLibraryRender } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { theme } from "../theme.ts";

/** Renders inside the same providers as the app, with an in-memory router at `route`. */
export function render(ui: ReactNode, { route = "/" }: { route?: string } = {}) {
  return testingLibraryRender(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MantineProvider theme={theme} env="test">
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </MantineProvider>
    ),
  });
}

export { screen } from "@testing-library/react";
