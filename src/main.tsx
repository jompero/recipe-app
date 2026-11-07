import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@fontsource-variable/cormorant";
import "@fontsource-variable/cormorant/wght-italic.css";
import "@fontsource-variable/eb-garamond";
import "@fontsource-variable/eb-garamond/wght-italic.css";
import "@fontsource-variable/jost";

import { MantineProvider } from "@mantine/core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { routes } from "./routes.tsx";
import { UpdateBanner } from "./components/UpdateBanner.tsx";
import { theme } from "./theme.ts";

const root = document.getElementById("root");
if (!root) throw new Error("#root element missing from index.html");

// Hash URLs because GitHub Pages can't serve deep links (ADR-0004). A data router
// (createHashRouter, not <HashRouter>) because scroll restoration and the unsaved-changes
// prompt need one.
const router = createHashRouter(routes);

createRoot(root).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <UpdateBanner />
      <RouterProvider router={router} />
    </MantineProvider>
  </StrictMode>,
);
