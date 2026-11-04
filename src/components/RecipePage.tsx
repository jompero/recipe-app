import { Text, Title } from "@mantine/core";
import { useParams } from "react-router";
import { useLiveRecipes } from "./liveRecipes.ts";

/** Placeholder recipe page: the title only. US-3.4 builds the real page. */
export function RecipePage() {
  const { id } = useParams();
  const live = useLiveRecipes();
  const recipe = live.status === "ready" ? live.recipes.find((r) => r.id === id) : undefined;
  return (
    <>
      <Title order={1} pt="xl">
        {recipe?.title ?? "Recipe"}
      </Title>
      <Text ta="center" c="dimmed" mt="md">
        The full recipe page comes in US-3.4.
      </Text>
    </>
  );
}
