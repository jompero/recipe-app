import {
  Alert,
  Box,
  Button,
  Chip,
  Group,
  Image,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  cookbookSearch,
  readCookbookState,
  letterGroups,
  selectRecipes,
  tagChips,
  type CookbookState,
} from "../cookbook/cookbook.ts";
import { Fragment, useState } from "react";
import { setArchived, type StoredRecipe } from "../data/recipes.ts";
import { LABEL_STYLE } from "../theme.ts";
import { useLiveRecipes } from "./liveRecipes.ts";
import { usePageActions } from "./pageActions.ts";
import { QuietToggle } from "./QuietToggle.tsx";

/** The cookbook: every recipe as a photo card (or a list), with search, tags and sort. */
export function CookbookPage() {
  const live = useLiveRecipes();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const state = readCookbookState(params);
  usePageActions(
    state.archived
      ? []
      : [
          { label: "New recipe", to: "/recipe/new" },
          { label: "Show archived", to: "/?archived=1" },
        ],
  );
  const [unarchiveError, setUnarchiveError] = useState<string | null>(null);
  // Only the Show archived view offers Unarchive on each recipe.
  const onUnarchive = state.archived
    ? (recipe: StoredRecipe) => {
        setUnarchiveError(null);
        setArchived(recipe.id, false).catch((cause: unknown) =>
          setUnarchiveError(cause instanceof Error ? cause.message : String(cause)),
        );
      }
    : undefined;
  // Filters replace the URL instead of adding history: Back leaves the cookbook.
  const update = (patch: Partial<CookbookState>) =>
    void navigate({ search: cookbookSearch({ ...state, ...patch }) }, { replace: true });

  const all = live.status === "ready" ? live.recipes : [];
  const shown = selectRecipes(all, state);
  const chips = tagChips(all, state.archived);

  return (
    <Stack gap="lg">
      <Stack gap={4} pt="xl">
        <Title order={1}>{state.archived ? "Archived" : "Cookbook"}</Title>
        {live.status === "ready" && (
          <Text ta="center" c="dimmed" style={LABEL_STYLE}>
            {shown.length} {shown.length === 1 ? "recipe" : "recipes"}
          </Text>
        )}
      </Stack>
      <TextInput
        type="search"
        aria-label="Search recipes"
        placeholder="Search"
        value={state.q}
        onChange={(event) => update({ q: event.currentTarget.value })}
        variant="unstyled"
        styles={{
          input: {
            borderBottom: "1px solid var(--mantine-color-gray-3)",
            fontStyle: "italic",
            fontSize: 18,
          },
        }}
      />
      <Group
        role="group"
        aria-label="Tags"
        gap={6}
        wrap="nowrap"
        style={{ overflowX: "auto" }}
        pb={4}
      >
        {chips.map((tag) => (
          <Chip
            key={tag}
            value={tag}
            size="xs"
            checked={state.tags.includes(tag)}
            onChange={(on) =>
              update({ tags: on ? [...state.tags, tag] : state.tags.filter((t) => t !== tag) })
            }
            styles={{ label: { flex: "none" } }}
          >
            {tag}
          </Chip>
        ))}
      </Group>
      <Group justify="space-between">
        <QuietToggle
          label="Sort"
          value={state.sort}
          onChange={(sort) => update({ sort })}
          options={[
            { value: "az", label: "A–Z" },
            { value: "new", label: "Newest" },
          ]}
        />
        <QuietToggle
          label="View"
          value={state.view}
          onChange={(view) => update({ view })}
          options={[
            { value: "grid", label: "Grid" },
            { value: "list", label: "List" },
          ]}
        />
      </Group>
      {unarchiveError && (
        <Alert color="red" title="Couldn't unarchive">
          {unarchiveError}
        </Alert>
      )}
      {live.status === "error" ? (
        <Alert color="red" title="Couldn't load the recipes">
          {live.message}
        </Alert>
      ) : live.status === "loading" ? (
        <SimpleGrid cols={2} spacing="sm" verticalSpacing="xl" aria-label="Loading recipes">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} style={{ aspectRatio: "4 / 5" }} />
          ))}
        </SimpleGrid>
      ) : live.status === "ready" && shown.length === 0 ? (
        <Stack align="center" gap="sm" py="xl">
          <Text fs="italic" c="dimmed">
            No recipes match
          </Text>
          <Button variant="outline" size="xs" onClick={() => update({ q: "", tags: [] })}>
            Clear filters
          </Button>
        </Stack>
      ) : state.view === "list" ? (
        <RecipeList recipes={shown} sort={state.sort} onUnarchive={onUnarchive} />
      ) : (
        <SimpleGrid cols={2} spacing="sm" verticalSpacing="xl">
          {shown.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onUnarchive={onUnarchive} />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}

const titleStyle = { letterSpacing: "0.16em", lineHeight: 1.35 } as const;

type Unarchive = ((recipe: StoredRecipe) => void) | undefined;

/** Unarchive, in the Show archived view. */
function UnarchiveButton({
  recipe,
  onUnarchive,
}: {
  recipe: StoredRecipe;
  onUnarchive: Unarchive;
}) {
  if (!onUnarchive) return null;
  return (
    <Button
      variant="subtle"
      size="compact-xs"
      aria-label={`Unarchive ${recipe.title}`}
      onClick={() => onUnarchive(recipe)}
      style={{ flex: "none" }}
    >
      Unarchive
    </Button>
  );
}

function RecipeCard({ recipe, onUnarchive }: { recipe: StoredRecipe; onUnarchive: Unarchive }) {
  return (
    <Stack gap={4} align="center">
      <RecipeCardLink recipe={recipe} />
      <UnarchiveButton recipe={recipe} onUnarchive={onUnarchive} />
    </Stack>
  );
}

function RecipeCardLink({ recipe }: { recipe: StoredRecipe }) {
  return (
    <UnstyledButton component={Link} to={`/recipe/${recipe.id}`} ta="center" w="100%">
      {recipe.thumbnail ? (
        <Image src={recipe.thumbnail} alt="" style={{ aspectRatio: "4 / 5" }} fit="cover" />
      ) : (
        <Box bg="gray.1" style={{ aspectRatio: "4 / 5" }} />
      )}
      <Text ff="heading" fs="italic" tt="uppercase" fz={13} mt="xs" style={titleStyle}>
        {recipe.title}
      </Text>
    </UnstyledButton>
  );
}

/** The list view: an A–Z index like a book's contents page. */
function RecipeList({
  recipes,
  sort,
  onUnarchive,
}: {
  recipes: StoredRecipe[];
  sort: CookbookState["sort"];
  onUnarchive: Unarchive;
}) {
  return (
    <Box component="ul" aria-label="Recipes" p={0} m={0} style={{ listStyle: "none" }}>
      {letterGroups(recipes, sort).map(({ letter, recipes: group }) => (
        <Fragment key={letter ?? "all"}>
          {letter && (
            <li>
              <Text component="h3" ff="heading" fs="italic" fz={28} c="linen.6" mt="lg" mb={4}>
                {letter}
              </Text>
            </li>
          )}
          {group.map((recipe) => (
            <li key={recipe.id}>
              <RecipeRow recipe={recipe} onUnarchive={onUnarchive} />
            </li>
          ))}
        </Fragment>
      ))}
    </Box>
  );
}

function RecipeRow({ recipe, onUnarchive }: { recipe: StoredRecipe; onUnarchive: Unarchive }) {
  const meta = [recipe.totalTime, recipe.tags.slice(0, 2).join(", ")].filter(Boolean).join(" · ");
  return (
    <Group gap={8} wrap="nowrap" style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}>
      <UnstyledButton
        component={Link}
        to={`/recipe/${recipe.id}`}
        py="sm"
        style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12 }}
      >
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text fz={19} lh={1.25}>
            {recipe.title}
          </Text>
          {meta && (
            <Text c="dimmed" mt={3} style={LABEL_STYLE}>
              {meta}
            </Text>
          )}
        </Box>
        {recipe.thumbnail ? (
          <Image src={recipe.thumbnail} alt="" w={56} h={56} fit="cover" style={{ flex: "none" }} />
        ) : (
          <Box bg="gray.1" w={56} h={56} style={{ flex: "none" }} />
        )}
      </UnstyledButton>
      <UnarchiveButton recipe={recipe} onUnarchive={onUnarchive} />
    </Group>
  );
}
