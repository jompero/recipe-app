import { App } from "./App.tsx";
import { render, screen } from "./test-utils/render.tsx";

test("the home route shows the app name", () => {
  render(<App />, { route: "/" });
  expect(screen.getByRole("heading", { name: "Recipes" })).toBeInTheDocument();
});
