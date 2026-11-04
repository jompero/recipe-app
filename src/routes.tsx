import type { RouteObject } from "react-router";
import { App } from "./App.tsx";
import { AccountPage } from "./components/AccountPage.tsx";
import { DataPage } from "./components/DataPage.tsx";
import { HomePage } from "./components/HomePage.tsx";

/**
 * The app's route tree. `main.tsx` mounts it with `createHashRouter` (hash URLs, ADR-0004); tests
 * mount the same tree with `createMemoryRouter`.
 */
export const routes: RouteObject[] = [
  {
    element: <App />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/data", element: <DataPage /> },
      { path: "/account", element: <AccountPage /> },
    ],
  },
];
