import { render as testingLibraryRender } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { Providers } from "./Providers.tsx";

/** Renders one component inside the app's providers, with an in-memory router at `route`. */
export function render(ui: ReactNode, { route = "/" }: { route?: string } = {}) {
  return testingLibraryRender(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <Providers>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Providers>
    ),
  });
}

export { screen } from "@testing-library/react";
