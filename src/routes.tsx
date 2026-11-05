import type { RouteObject } from "react-router";
import { App } from "./App.tsx";
import { AccountPage } from "./components/AccountPage.tsx";
import { CookbookPage } from "./components/CookbookPage.tsx";
import { DataPage } from "./components/DataPage.tsx";
import { EditPage } from "./components/EditPage.tsx";
import { ImportPage } from "./components/ImportPage.tsx";
import { PastePage } from "./components/PastePage.tsx";
import { PlanPage } from "./components/PlanPage.tsx";
import { RecipePage } from "./components/RecipePage.tsx";
import { RollPage } from "./components/RollPage.tsx";

/**
 * The app's route tree. `main.tsx` mounts it with `createHashRouter` (hash URLs, ADR-0004); tests
 * mount the same tree with `createMemoryRouter`.
 */
export const routes: RouteObject[] = [
  {
    element: <App />,
    children: [
      { path: "/", element: <CookbookPage /> },
      { path: "/paste", element: <PastePage /> },
      { path: "/import", element: <ImportPage /> },
      { path: "/recipe/new", element: <EditPage /> },
      { path: "/recipe/:id", element: <RecipePage /> },
      { path: "/recipe/:id/edit", element: <EditPage /> },
      { path: "/plan", element: <PlanPage /> },
      { path: "/plan/roll", element: <RollPage /> },
      { path: "/data", element: <DataPage /> },
      { path: "/account", element: <AccountPage /> },
    ],
  },
];
