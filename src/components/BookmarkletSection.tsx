import { Anchor, Button, CopyButton, List, Stack, Text, Textarea, Title } from "@mantine/core";
import { useCallback } from "react";
import { bookmarkletHref } from "../bookmarklet/bookmarklet.ts";

/** One browser's install steps. */
function Steps({ browser, steps }: { browser: string; steps: string[] }) {
  return (
    <div>
      <Text fw={600} size="sm">
        {browser}
      </Text>
      <List type="ordered" size="sm">
        {steps.map((step) => (
          <List.Item key={step}>{step}</List.Item>
        ))}
      </List>
    </div>
  );
}

/**
 * The install page for the Recipe bookmarklet (US-4.4): a link to drag to the bookmarks bar, the
 * code to copy, and steps per browser. The bookmarklet opens the app at this page's own address,
 * so one installed from the dev server opens the dev app.
 */
export function BookmarkletSection() {
  const href = bookmarkletHref(window.location.origin + window.location.pathname);

  // React 19 replaces a `javascript:` href prop with one that throws ("React has blocked a
  // javascript: URL"), so the link gets its href straight on the DOM node and no href prop.
  const linkRef = useCallback(
    (link: HTMLAnchorElement | null) => link?.setAttribute("href", href),
    [href],
  );

  return (
    <Stack>
      <Title order={3}>Recipe bookmarklet</Title>
      <Text size="sm" c="dimmed">
        Click it on a recipe website to open the recipe here as a new recipe, ready to check and
        save.
      </Text>
      <Stack gap={4} align="flex-start">
        <Anchor ref={linkRef} fw={600}>
          Recipe bookmarklet
        </Anchor>
        <Text size="sm">Drag this to your bookmarks bar</Text>
      </Stack>

      <Textarea label="Bookmarklet code" value={href} readOnly autosize maxRows={4} />
      <CopyButton value={href}>
        {({ copied, copy }) => (
          <Button variant="default" onClick={copy} style={{ alignSelf: "flex-start" }}>
            {copied ? "Copied" : "Copy"}
          </Button>
        )}
      </CopyButton>

      <Steps
        browser="Chrome, Firefox and Edge"
        steps={[
          "Show the bookmarks bar (Ctrl+Shift+B, or Cmd+Shift+B on a Mac).",
          "Drag the Recipe bookmarklet link above onto it.",
          "On a recipe page, click the bookmark.",
        ]}
      />
      <Steps
        browser="iPhone (Safari)"
        steps={[
          "Copy the code above.",
          "Bookmark any page (Share, then Add Bookmark) and name it Recipe bookmarklet.",
          "Open your bookmarks, tap Edit, open the new bookmark and replace its address with the code.",
          "On a recipe page, open your bookmarks and tap it.",
        ]}
      />
      <Steps
        browser="Android (Chrome)"
        steps={[
          "Copy the code above.",
          "Bookmark any page (the star in the menu), then edit the bookmark: name it Recipe bookmarklet and replace its URL with the code.",
          "On a recipe page, type Recipe bookmarklet in the address bar and tap the bookmark in the suggestions.",
        ]}
      />
      <Text size="sm">
        Safari (Mac and iPhone) can't run it on some sites. Use Paste recipe there.
      </Text>
    </Stack>
  );
}
