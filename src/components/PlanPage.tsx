import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Group,
  Image,
  Menu,
  Skeleton,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { addEntry, moveEntry, removeEntry, type MenuEntry } from "../data/menu.ts";
import type { StoredRecipe } from "../data/recipes.ts";
import {
  addDays,
  dayLabel,
  mondayOf,
  parseDateKey,
  toDateKey,
  weekDays,
  weekFromParam,
  weekLabel,
} from "../plan/week.ts";
import { LABEL_STYLE } from "../theme.ts";
import { AddEntrySheet } from "./AddEntrySheet.tsx";
import { useLiveRecipes } from "./liveRecipes.ts";
import { usePageMenu } from "./pageMenu.ts";
import { PlanDatePicker } from "./PlanDatePicker.tsx";
import { usePlanDays } from "./usePlanDays.ts";

/**
 * The Plan (US-5.1, US-5.2): one week, Monday to Sunday, kept live, with the week in the URL.
 * Members add recipes and notes to a day, and remove or move entries.
 */
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

  /** The day whose "+" sheet is open. */
  const [addingTo, setAddingTo] = useState<string | null>(null);
  /** The entry whose Move to… picker is open, and its day. */
  const [moving, setMoving] = useState<{ date: string; entry: MenuEntry } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Changing week replaces the URL: Back leaves the Plan instead of stepping through weeks.
  const goToWeek = (week: Date | null) =>
    void navigate({ search: week ? `?week=${toDateKey(week)}` : "" }, { replace: true });

  // Writes aren't awaited: the live week shows them at once, also offline, where the promise only
  // settles once the device is back online. A failure (e.g. the rules) is shown when it comes.
  const save = (write: Promise<unknown>) => {
    setSaveError(null);
    write.catch((cause: unknown) =>
      setSaveError(cause instanceof Error ? cause.message : String(cause)),
    );
  };

  const labelOf = (date: string) => {
    const day = parseDateKey(date);
    return day ? dayLabel(day) : date;
  };

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
      {saveError && (
        <Alert
          color="red"
          title="Couldn't save the change"
          withCloseButton
          onClose={() => setSaveError(null)}
        >
          {saveError}
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
              onAdd={() => setAddingTo(key)}
              onRemove={(entry) => save(removeEntry(key, entry))}
              onMove={(entry) => setMoving({ date: key, entry })}
            />
          );
        })}
      </Stack>
      <AddEntrySheet
        opened={addingTo !== null}
        dayLabel={addingTo ? labelOf(addingTo) : ""}
        recipes={recipes.status === "ready" ? recipes.recipes : []}
        onAdd={(entry) => {
          if (addingTo) save(addEntry(addingTo, entry));
          setAddingTo(null);
        }}
        onClose={() => setAddingTo(null)}
      />
      <PlanDatePicker
        opened={moving !== null}
        title="Move to…"
        start={moving?.date ?? todayKey}
        selected={moving?.date ?? null}
        onPick={(to) => {
          if (moving) save(moveEntry(moving.date, to, moving.entry));
          setMoving(null);
        }}
        onClose={() => setMoving(null)}
      />
    </Stack>
  );
}

/** One day: its heading and "+", then its entries. Past days are dimmed; today is marked. */
function PlanDay({
  label,
  isToday,
  isPast,
  entries,
  recipes,
  onAdd,
  onRemove,
  onMove,
}: {
  label: string;
  isToday: boolean;
  isPast: boolean;
  /** null while the week is loading. */
  entries: MenuEntry[] | null;
  /** null while the recipes are loading. */
  recipes: StoredRecipe[] | null;
  onAdd: () => void;
  onRemove: (entry: MenuEntry) => void;
  onMove: (entry: MenuEntry) => void;
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
      <Group justify="space-between" mb={6} wrap="nowrap">
        <Group gap="sm" align="baseline">
          <Text ff="heading" fs="italic" fz={18}>
            {label}
          </Text>
          {isToday && (
            <Text c="linen.6" style={LABEL_STYLE}>
              Today
            </Text>
          )}
        </Group>
        <ActionIcon variant="subtle" aria-label={`Add to ${label}`} onClick={onAdd}>
          +
        </ActionIcon>
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
              <Entry
                entry={entry}
                recipes={recipes}
                onRemove={() => onRemove(entry)}
                onMove={() => onMove(entry)}
              />
            </li>
          ))}
        </Stack>
      )}
    </Box>
  );
}

const THUMB = 44;

/** An entry, with its "…" menu (Remove, Move to…). */
function Entry({
  entry,
  recipes,
  onRemove,
  onMove,
}: {
  entry: MenuEntry;
  recipes: StoredRecipe[] | null;
  onRemove: () => void;
  onMove: () => void;
}) {
  const recipe =
    "recipeId" in entry && recipes
      ? recipes.find((candidate) => candidate.id === entry.recipeId)
      : undefined;
  const name = "note" in entry ? entry.note : (recipe?.title ?? "Missing recipe");
  return (
    <Group gap="xs" wrap="nowrap" justify="space-between">
      <Box style={{ flex: 1, minWidth: 0 }}>
        <EntryContent entry={entry} recipe={recipe} recipesLoading={recipes === null} />
      </Box>
      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <ActionIcon variant="subtle" color="gray" aria-label={`Options for ${name}`}>
            ⋯
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={onMove}>Move to…</Menu.Item>
          <Menu.Item color="red" onClick={onRemove}>
            Remove
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}

function EntryContent({
  entry,
  recipe,
  recipesLoading,
}: {
  entry: MenuEntry;
  recipe: StoredRecipe | undefined;
  recipesLoading: boolean;
}) {
  if ("note" in entry) {
    return (
      <Text fs="italic" c="dimmed" py={4}>
        {entry.note}
      </Text>
    );
  }
  if (recipesLoading) return <Skeleton height={THUMB} />;
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
