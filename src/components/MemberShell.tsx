import {
  ActionIcon,
  AppShell,
  Box,
  Divider,
  Modal,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useState, type ReactNode } from "react";
import { matchPath, useLocation, useNavigate } from "react-router";
import { LABEL_STYLE } from "../theme.ts";
import { OFFLINE_STRIP_HEIGHT, OfflineStrip } from "./OfflineStrip.tsx";
import { NO_PAGE_MENU, PageMenuContext, type PageMenu } from "./pageMenu.ts";
import { SECTIONS } from "./sections.ts";
import { CONTENT_MAX_WIDTH, TOP_BAR_HEIGHT, TopBar } from "./TopBar.tsx";
import { useOfflineStrip } from "./useOffline.ts";
import { useWide } from "./useWide.ts";

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

/**
 * The frame for signed-in members. Phones get the one bottom button and the menu overlay; wide
 * screens (iPad landscape, desktop) get the top bar and content capped at CONTENT_MAX_WIDTH.
 */
export function MemberShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const menu = useMenu();
  const [page, setPage] = useState<PageMenu>(NO_PAGE_MENU);
  const offline = useOfflineStrip();
  const wide = useWide();
  // The edit form has its own Save / Cancel bar instead of the menu button or the top bar.
  const editing = isEditForm(location.pathname);
  const topBar = wide && !editing;

  return (
    // --offline-strip: how far the bottom controls (this menu button, the edit form's bar) move up
    // while the offline strip shows under them. --top-bar: how far sticky things on a page sit
    // below the top bar.
    <AppShell
      padding="md"
      header={topBar ? { height: TOP_BAR_HEIGHT } : undefined}
      style={{
        "--offline-strip": `${String(offline ? OFFLINE_STRIP_HEIGHT : 0)}px`,
        "--top-bar": `${String(topBar ? TOP_BAR_HEIGHT : 0)}px`,
      }}
    >
      {topBar && <TopBar page={page} />}
      {/* Bottom padding keeps the last lines of a page clear of the menu button. */}
      <AppShell.Main pb={wide ? 48 : 100}>
        <PageMenuContext.Provider value={setPage}>
          <Box maw={wide ? CONTENT_MAX_WIDTH : undefined} mx="auto">
            {children}
          </Box>
        </PageMenuContext.Provider>
      </AppShell.Main>
      {!wide && !editing && (
        <ActionIcon
          aria-label="Menu"
          onClick={menu.show}
          size={52}
          radius="xl"
          variant="default"
          pos="fixed"
          bottom="calc(18px + var(--offline-strip, 0px))"
          left="50%"
          style={{ transform: "translateX(-50%)", zIndex: 100 }}
        >
          <MenuGlyph />
        </ActionIcon>
      )}
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
