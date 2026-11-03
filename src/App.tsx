import { Route, Routes } from "react-router";
import { HomePage } from "./components/HomePage.tsx";

/** Routes only. Providers (Mantine, router) live in main.tsx so tests can supply their own. */
export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}
