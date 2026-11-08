import { AppShell, Button, Group, UnstyledButton } from "@mantine/core";
import { Link, useLocation, useNavigate } from "react-router";
import { LABEL_STYLE } from "../theme.ts";
import type { PageMenu } from "./pageMenu.ts";
import { SECTIONS, sectionOf } from "./sections.ts";

/** The top bar's height in px. MemberShell sets it as --top-bar, for sticky things below it. */
export const TOP_BAR_HEIGHT = 56;

/** Widest the content gets on a wide screen; the top bar's contents line up with it. */
export const CONTENT_MAX_WIDTH = 1200;

/**
 * The wide layout's navigation (Epic 10, US-10.2): the sections on the left, the current page's
 * actions on the right. Phones get the bottom button and the menu overlay instead.
 */
export function TopBar({ page }: { page: PageMenu }) {
  const location = useLocation();
  const navigate = useNavigate();
  const current = sectionOf(location.pathname);
  return (
    <AppShell.Header withBorder={false}>
      <Group
        h="100%"
        maw={CONTENT_MAX_WIDTH}
        mx="auto"
        px="md"
        justify="space-between"
        wrap="nowrap"
        style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}
      >
        <Group component="nav" aria-label="Sections" gap={28} wrap="nowrap">
          {SECTIONS.map(({ label, path }) => {
            const here = current === path;
            return (
              <UnstyledButton
                key={path}
                component={Link}
                to={path}
                aria-current={here ? "page" : undefined}
                py={6}
                style={{
                  ...LABEL_STYLE,
                  fontSize: 12,
                  color: here ? undefined : "var(--mantine-color-dimmed)",
                  borderBottom: `1px solid ${here ? "currentColor" : "transparent"}`,
                }}
              >
                {label}
              </UnstyledButton>
            );
          })}
        </Group>
        {page.actions.length > 0 && (
          <Group role="group" aria-label="Page actions" gap={4} wrap="nowrap">
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
        )}
      </Group>
    </AppShell.Header>
  );
}
