import { Anchor, Skeleton, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";
import { groupByRecipe } from "../groceries/groupByRecipe.ts";
import { usePageMenu } from "./pageMenu.ts";
import { useGroceryList } from "./useGroceryList.ts";

/**
 * A stand-in for the grocery list page (US-6.5 replaces it): the saved lines as written, by
 * recipe, so the builder (US-6.4) can be checked in the app.
 */
export function GroceryListPage() {
  usePageMenu("Grocery list", [{ label: "New list…", to: "/groceries/new" }]);
  const live = useGroceryList();

  return (
    <Stack gap="lg">
      <Title order={1} pt="xl" ta="center">
        Grocery list
      </Title>
      {live.status === "loading" ? (
        <Skeleton height={120} aria-label="Loading" />
      ) : live.status === "error" ? (
        <Text c="red">{live.message}</Text>
      ) : live.list.lines.length === 0 ? (
        <Text fs="italic" c="dimmed" ta="center">
          No grocery list yet.{" "}
          <Anchor component={Link} to="/groceries/new">
            Build one
          </Anchor>
        </Text>
      ) : (
        groupByRecipe(live.list.lines).map((group) => (
          <Stack key={group.entryId ?? "by-hand"} gap={2}>
            <Text ff="heading" fs="italic" fz={18}>
              {group.title ?? "Added by hand"}
              {group.scale && group.scale !== 1 ? ` ${String(group.scale)}×` : ""}
            </Text>
            {group.lines.map((line) => (
              <Text key={line.id} fz="sm">
                {line.raw}
              </Text>
            ))}
          </Stack>
        ))
      )}
    </Stack>
  );
}
