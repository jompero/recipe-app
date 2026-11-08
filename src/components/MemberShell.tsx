import {
  ActionIcon,
  AppShell,
  Box,
  Button,
  Divider,
  Group,
  Modal,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useState, type ReactNode } from "react";
import { Link, matchPath, useLocation, useNavigate } from "react-router";
import { PrototypeBar } from "../prototype/PrototypeBar.tsx";
import { usePrototypeVariant, useWide } from "../prototype/prototypeStore.ts";
import { LABEL_STYLE } from "../theme.ts";
import { OFFLINE_STRIP_HEIGHT, OfflineStrip } from "./OfflineStrip.tsx";
import { NO_PAGE_MENU, PageMenuContext, type PageMenu } from "./pageMenu.ts";
import { useOfflineStrip } from "./useOffline.ts";

const SECTIONS = [
  { label: "Cookbook", path: "/" },
  { label: "Plan", path: "/plan" },
  { label: "Grocery list", path: "/groceries" },
  { label: "Data", path: "/data" },
  { label: "Account", path: "/account" },
];

function isEditForm(pathname: string): boolean {
  return (
    matchPath("/recipe/new", pathname) !== null || matchPath("/recipe/:id/edit", pathname) !== null
  );
}

/** Whether the menu overlay is open: it's a history entry, so phone Back closes it. */
function useMenu() {
  const location = useLocation();
  const navigate = useNavigate();
  const open = (location.state as { menu?: boolean } | null)?.menu === true;
  const show = () => void navigate(location, { state: { menu: true } });
  const close = () => void navigate(-1);
  /**
   * Goes to a page from the menu. The menu's history entry is replaced, so Back from there returns
   * to the page that was under the menu. Choosing the page that's already underneath just closes.
   */
  const go = (path: string) => {
    if (path === location.pathname + location.search) close();
    else void navigate(path, { replace: true });
  };
  return { open, show, close, go };
}

/** PROTOTYPE: which section a path belongs to, for the top bar's underline. */
function sectionOf(pathname: string): string {
  if (pathname.startsWith("/plan")) return "/plan";
  if (pathname.startsWith("/groceries")) return "/groceries";
  if (pathname.startsWith("/data")) return "/data";
  if (pathname.startsWith("/account")) return "/account";
  return "/";
}

const TOP_BAR_HEIGHT = 56;

/** Phone-first frame for signed-in members. */
export function MemberShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const menu = useMenu();
  const [page, setPage] = useState<PageMenu>(NO_PAGE_MENU);
  const offline = useOfflineStrip();
  // PROTOTYPE (US-10.1): the wide-screen shell variants.
  const wide = useWide();
  const shell = usePrototypeVariant({
    key: "shell",
    label: "Shell",
    options: [
      { value: "bar", label: "Top bar" },
      { value: "corner", label: "Corner button" },
      { value: "today", label: "Today (bottom)" },
    ],
  });
  const mode = wide ? shell : "today";
  const editing = isEditForm(location.pathname);
  const capped = wide && shell !== "today";

  return (
    // --offline-strip: how far the bottom controls (this menu button, the edit form's bar) move up
    // while the offline strip shows under them.
    <AppShell
      padding="md"
      header={mode === "bar" && !editing ? { height: TOP_BAR_HEIGHT } : undefined}
      style={{
        "--offline-strip": `${String(offline ? OFFLINE_STRIP_HEIGHT : 0)}px`,
        "--top-bar": `${String(mode === "bar" && !editing ? TOP_BAR_HEIGHT : 0)}px`,
      }}
    >
      {mode === "bar" && !editing && (
        <AppShell.Header withBorder={false}>
          <Group
            h="100%"
            maw={1200}
            mx="auto"
            px="md"
            justify="space-between"
            wrap="nowrap"
            style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}
          >
            <Group gap={28} wrap="nowrap" component="nav" aria-label="Sections">
              {SECTIONS.map(({ label, path }) => {
                const current = sectionOf(location.pathname) === path;
                return (
                  <UnstyledButton
                    key={label}
                    component={Link}
                    to={path}
                    aria-current={current ? "page" : undefined}
                    style={{
                      ...LABEL_STYLE,
                      fontSize: 12,
                      paddingBlock: 6,
                      borderBottom: `1px solid ${current ? "currentColor" : "transparent"}`,
                      color: current ? undefined : "var(--mantine-color-dimmed)",
                    }}
                  >
                    {label}
                  </UnstyledButton>
                );
              })}
            </Group>
            <Group gap={4} wrap="nowrap">
              {page.actions.map((action) => (
                <Button
                  key={action.label}
                  variant="subtle"
                  size="compact-sm"
                  onClick={() => {
                    if ("to" in action) void navigate(action.to);
                    else action.onSelect();
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </Group>
          </Group>
        </AppShell.Header>
      )}
      {/* Bottom padding keeps the last lines of a page clear of the menu button. */}
      <AppShell.Main pb={mode === "today" ? 100 : 48}>
        <PageMenuContext.Provider value={setPage}>
          {capped ? (
            <Box maw={1200} mx="auto">
              {children}
            </Box>
          ) : (
            children
          )}
        </PageMenuContext.Provider>
      </AppShell.Main>
      {/* The edit form has its own Save / Cancel bar instead. */}
      {!editing && mode !== "bar" && (
        <ActionIcon
          aria-label="Menu"
          onClick={menu.show}
          size={52}
          radius="xl"
          variant="default"
          pos="fixed"
          {...(mode === "corner"
            ? { top: 16, right: 16, style: { zIndex: 100 } }
            : {
                bottom: "calc(18px + var(--offline-strip, 0px))",
                left: "50%",
                style: { transform: "translateX(-50%)", zIndex: 100 },
              })}
        >
          <MenuGlyph />
        </ActionIcon>
      )}
      <PrototypeBar />
      {offline && <OfflineStrip />}
      <Modal
        opened={menu.open}
        onClose={menu.close}
        fullScreen
        title="Menu"
        styles={{
          title: { ...LABEL_STYLE, fontSize: 12, color: "var(--mantine-color-dimmed)" },
          body: { minHeight: "80dvh", display: "flex", alignItems: "center" },
        }}
      >
        <Stack gap={0} w="100%">
          {(page.title !== null || page.actions.length > 0) && (
            <>
              {page.title !== null && (
                <Text
                  component="h2"
                  ff="heading"
                  fs="italic"
                  fw={400}
                  fz={24}
                  lh={1.25}
                  ta="center"
                  m={0}
                  mb="xs"
                  px="md"
                >
                  {page.title}
                </Text>
              )}
              {page.actions.map((action) => (
                <UnstyledButton
                  key={action.label}
                  onClick={() => {
                    if ("to" in action) {
                      menu.go(action.to);
                    } else {
                      menu.close();
                      action.onSelect();
                    }
                  }}
                  py="sm"
                  ta="center"
                  style={{ ...LABEL_STYLE, fontSize: 12 }}
                >
                  {action.label}
                </UnstyledButton>
              ))}
              <Divider my="xl" mx={40} />
            </>
          )}
          {SECTIONS.map(({ label, path }) => (
            <UnstyledButton key={label} onClick={() => menu.go(path)} py="sm" ta="center">
              <Text
                component="span"
                ff="heading"
                fz={30}
                fs="italic"
                tt="uppercase"
                style={{ letterSpacing: "0.14em" }}
              >
                {label}
              </Text>
            </UnstyledButton>
          ))}
        </Stack>
      </Modal>
    </AppShell>
  );
}

/** Three thin lines: the one button. */
function MenuGlyph() {
  return (
    <Stack gap={4} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{ display: "block", width: 18, height: 1.5, background: "currentColor" }}
        />
      ))}
    </Stack>
  );
}
