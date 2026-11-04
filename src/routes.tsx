import type { RouteObject } from "react-router";
import { App } from "./App.tsx";
import { AccountPage } from "./components/AccountPage.tsx";
import { CookbookPage } from "./components/CookbookPage.tsx";
import { DataPage } from "./components/DataPage.tsx";
import { EditPage } from "./components/EditPage.tsx";
import { RecipePage } from "./components/RecipePage.tsx";

/**
 * The app's route tree. `main.tsx` mounts it with `createHashRouter` (hash URLs, ADR-0004); tests
 * mount the same tree with `createMemoryRouter`.
 */
export const routes: RouteObject[] = [
  {
    element: <App />,
    children: [
      { path: "/", element: <CookbookPage /> },
      { path: "/recipe/new", element: <EditPage /> },
      { path: "/recipe/:id", element: <RecipePage /> },
      { path: "/recipe/:id/edit", element: <EditPage /> },
      { path: "/data", element: <DataPage /> },
      { path: "/account", element: <AccountPage /> },
    ],
  },
];
