import { MantineProvider } from "@mantine/core";
import type { ReactNode } from "react";
import { theme } from "../theme.ts";

/** The app's providers, minus the router. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={theme} env="test">
      {children}
    </MantineProvider>
  );
}
