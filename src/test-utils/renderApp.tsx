// Separate from render.tsx because it imports the whole route tree, so every src/data module
// the pages use must be faked (vi.mock) in tests that call it.
import { act, render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { routes } from "../routes.tsx";
import { Providers } from "./Providers.tsx";

/** Renders the whole app (the real route tree) at `route`. `back()` is the phone's Back button. */
export function renderApp(route = "/") {
  const router = createMemoryRouter(routes, { initialEntries: [route] });
  const result = render(
    <Providers>
      <RouterProvider router={router} />
    </Providers>,
  );
  const back = () => act(() => router.navigate(-1));
  return { ...result, router, back };
}

export { screen } from "@testing-library/react";
