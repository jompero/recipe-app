import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Group,
  Image,
  Skeleton,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { MenuEntry } from "../data/menu.ts";
import type { StoredRecipe } from "../data/recipes.ts";
import {
  addDays,
  dayLabel,
  mondayOf,
  toDateKey,
  weekDays,
  weekFromParam,
  weekLabel,
} from "../plan/week.ts";
import { LABEL_STYLE } from "../theme.ts";
import { useLiveRecipes } from "./liveRecipes.ts";
import { usePageMenu } from "./pageMenu.ts";
import { usePlanDays } from "./usePlanDays.ts";

/** The Plan (US-5.1): one week, Monday to Sunday, kept live. The week is in the URL. */
export function PlanPage() {
  usePageMenu("Plan");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const today = new Date();
  const todayKey = toDateKey(today);
  const monday = weekFromParam(params.get("week"), today);
  const days = weekDays(monday);
  const first = toDateKey(monday);
  const live = usePlanDays(first, toDateKey(days[6]!));
  const recipes = useLiveRecipes();
  const isThisWeek = first === toDateKey(mondayOf(today));

  // Changing week replaces the URL: Back leaves the Plan instead of stepping through weeks.
  const goToWeek = (week: Date | null) =>
    void navigate({ search: week ? `?week=${toDateKey(week)}` : "" }, { replace: true });

  return (
    <Stack gap="lg">
      <Stack gap={4} pt="xl" align="center">
        <Title order={1}>Plan</Title>
        <Group gap="xs" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            aria-label="Previous week"
            onClick={() => goToWeek(addDays(monday, -7))}
          >
            ‹
          </ActionIcon>
          <Text c="dimmed" style={LABEL_STYLE} miw={170} ta="center">
            {weekLabel(monday)}
          </Text>
          <ActionIcon
            variant="subtle"
            aria-label="Next week"
            onClick={() => goToWeek(addDays(monday, 7))}
          >
            ›
          </ActionIcon>
        </Group>
        {!isThisWeek && (
          <Button variant="subtle" size="compact-xs" onClick={() => goToWeek(null)}>
            Today
          </Button>
        )}
      </Stack>
      {live.status === "error" && (
        <Alert color="red" title="Couldn't load the plan">
          {live.message}
        </Alert>
      )}
      <Stack gap={0}>
        {days.map((date) => {
          const key = toDateKey(date);
          return (
            <PlanDay
              key={key}
              label={dayLabel(date)}
              isToday={key === todayKey}
              isPast={key < todayKey}
              entries={live.status === "ready" ? (live.days[key] ?? []) : null}
              recipes={recipes.status === "ready" ? recipes.recipes : null}
            />
          );
        })}
      </Stack>
    </Stack>
  );
}

/** One day: its heading, then its entries. Past days are dimmed; today is marked. */
function PlanDay({
  label,
  isToday,
  isPast,
  entries,
  recipes,
}: {
  label: string;
  isToday: boolean;
  isPast: boolean;
  /** null while the week is loading. */
  entries: MenuEntry[] | null;
  /** null while the recipes are loading. */
  recipes: StoredRecipe[] | null;
}) {
  return (
    <Box
      component="section"
      aria-label={label}
      aria-current={isToday ? "date" : undefined}
      data-past={isPast || undefined}
      py="sm"
      px="xs"
      style={{
        borderBottom: "1px solid var(--mantine-color-gray-3)",
        borderLeft: `3px solid ${isToday ? "var(--mantine-color-linen-6)" : "transparent"}`,
        opacity: isPast ? 0.55 : 1,
      }}
    >
      <Group justify="space-between" mb={6}>
        <Text ff="heading" fs="italic" fz={18}>
          {label}
        </Text>
        {isToday && (
          <Text c="linen.6" style={LABEL_STYLE}>
            Today
          </Text>
        )}
      </Group>
      {entries === null ? (
        <Skeleton height={44} aria-label="Loading" />
      ) : entries.length === 0 ? (
        <Text fz="sm" fs="italic" c="dimmed">
          Nothing planned
        </Text>
      ) : (
        <Stack component="ul" gap={6} p={0} m={0} style={{ listStyle: "none" }}>
          {entries.map((entry) => (
            <li key={entry.id}>
              <Entry entry={entry} recipes={recipes} />
            </li>
          ))}
        </Stack>
      )}
    </Box>
  );
}

const THUMB = 44;

function Entry({ entry, recipes }: { entry: MenuEntry; recipes: StoredRecipe[] | null }) {
  if ("note" in entry) {
    return (
      <Text fs="italic" c="dimmed" py={4}>
        {entry.note}
      </Text>
    );
  }
  if (recipes === null) return <Skeleton height={THUMB} />;
  const recipe = recipes.find((candidate) => candidate.id === entry.recipeId);
  if (!recipe) {
    return (
      <Text fz="sm" c="dimmed" py={4}>
        Missing recipe
      </Text>
    );
  }
  return (
    <UnstyledButton component={Link} to={`/recipe/${recipe.id}`} w="100%">
      <Group gap="sm" wrap="nowrap">
        {recipe.thumbnail ? (
          <Image src={recipe.thumbnail} alt="" w={THUMB} h={THUMB} fit="cover" radius="xs" />
        ) : (
          <Box bg="gray.1" w={THUMB} h={THUMB} style={{ flex: "none" }} />
        )}
        <Stack gap={0}>
          <Text ff="heading" fz={17} lh={1.25}>
            {recipe.title}
          </Text>
          {recipe.archived && (
            <Text c="dimmed" style={LABEL_STYLE}>
              Archived
            </Text>
          )}
        </Stack>
      </Group>
    </UnstyledButton>
  );
}
