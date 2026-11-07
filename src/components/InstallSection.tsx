import { List, Stack, Text, Title } from "@mantine/core";

/**
 * Whether the app is running as the installed app (opened from the home screen). The
 * `display-mode` media query is the standard check; `navigator.standalone` is Apple's older one,
 * kept as a fallback for iOS.
 */
function isInstalledApp(): boolean {
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return window.matchMedia("(display-mode: standalone)").matches || standalone;
}

/**
 * How to install the app on a phone (US-9.6). iPhones never offer to install a site, so the steps
 * are spelled out here, and the owner can send the same text to members. Hidden in the installed
 * app itself.
 */
export function InstallSection() {
  if (isInstalledApp()) return null;
  return (
    <Stack gap="xs">
      <Title order={3}>Install on your phone</Title>
      <Text size="sm" c="dimmed">
        Opens full screen from your home screen and keeps working without a connection.
      </Text>
      <List type="ordered" size="sm">
        <List.Item>
          In Safari or Chrome, tap Share, then Add to Home Screen. Keep “Open as Web App” on.
        </List.Item>
        <List.Item>Open Recipes from your home screen.</List.Item>
        <List.Item>Sign in once more: the installed app keeps its own sign-in.</List.Item>
      </List>
    </Stack>
  );
}
