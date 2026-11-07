import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RegisterSWOptions } from "virtual:pwa-register/react";
import { theme } from "../theme.ts";
import { UpdateBanner } from "./UpdateBanner.tsx";

// The plugin's register hook, faked: the tests decide whether a new version is waiting.
const fake = vi.hoisted(() => ({
  needRefresh: false,
  updateServiceWorker: vi.fn(() => Promise.resolve()),
  options: undefined as RegisterSWOptions | undefined,
}));
vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: (options: RegisterSWOptions) => {
    fake.options = options;
    return {
      needRefresh: [fake.needRefresh, () => {}],
      offlineReady: [false, () => {}],
      updateServiceWorker: fake.updateServiceWorker,
    };
  },
}));

const renderBanner = () =>
  render(
    <MantineProvider theme={theme}>
      <UpdateBanner />
    </MantineProvider>,
  );

beforeEach(() => {
  fake.needRefresh = false;
  fake.updateServiceWorker.mockClear();
});

test("shows nothing while no new version is waiting", () => {
  renderBanner();
  expect(screen.queryByRole("status", { name: "Update ready" })).not.toBeInTheDocument();
});

test("a waiting version shows the banner, and Reload switches to it", async () => {
  fake.needRefresh = true;
  renderBanner();
  const banner = screen.getByRole("status", { name: "Update ready" });
  await userEvent.click(screen.getByRole("button", { name: "Reload" }));
  expect(fake.updateServiceWorker).toHaveBeenCalledOnce();
  expect(banner).toBeInTheDocument();
});

test("checks for a new version each time the app comes back into view", () => {
  renderBanner();
  const update = vi.fn(() => Promise.resolve());
  fake.options?.onRegisteredSW?.("sw.js", { update } as unknown as ServiceWorkerRegistration);

  const visibility = vi.spyOn(document, "visibilityState", "get");
  visibility.mockReturnValue("hidden");
  document.dispatchEvent(new Event("visibilitychange"));
  expect(update).not.toHaveBeenCalled();

  visibility.mockReturnValue("visible");
  document.dispatchEvent(new Event("visibilitychange"));
  expect(update).toHaveBeenCalledOnce();
  visibility.mockRestore();
});
