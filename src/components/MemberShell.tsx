import { ActionIcon, AppShell, Divider, Modal, Stack, Text, UnstyledButton } from "@mantine/core";
import { useState, type ReactNode } from "react";
import { matchPath, useLocation, useNavigate } from "react-router";
import { LABEL_STYLE } from "../theme.ts";
import { NO_PAGE_MENU, PageMenuContext, type PageMenu } from "./pageMenu.ts";

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

/** Phone-first frame for signed-in members. */
export function MemberShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const menu = useMenu();
  const [page, setPage] = useState<PageMenu>(NO_PAGE_MENU);

  return (
    <AppShell padding="md">
      {/* Bottom padding keeps the last lines of a page clear of the menu button. */}
      <AppShell.Main pb={100}>
        <PageMenuContext.Provider value={setPage}>{children}</PageMenuContext.Provider>
      </AppShell.Main>
      {/* The edit form has its own Save / Cancel bar instead. */}
      {!isEditForm(location.pathname) && (
        <ActionIcon
          aria-label="Menu"
          onClick={menu.show}
          size={52}
          radius="xl"
          variant="default"
          pos="fixed"
          bottom={18}
          left="50%"
          style={{ transform: "translateX(-50%)", zIndex: 100 }}
        >
          <MenuGlyph />
        </ActionIcon>
      )}
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
