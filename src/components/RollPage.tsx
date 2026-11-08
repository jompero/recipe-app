import {
  Box,
  Button,
  Chip,
  Group,
  Image,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useReducedMotion } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { tagChips } from "../cookbook/cookbook.ts";
import { saveRoll, type MenuEntry } from "../data/menu.ts";
import type { StoredRecipe } from "../data/recipes.ts";
import {
  clampRange,
  decodeRoll,
  encodeRoll,
  noRepeatWindow,
  plannedRecipes,
  rollAdditions,
  rollPool,
  rollRows,
  rowsForRange,
  type Roll,
  type RollRow,
} from "../plan/roll.ts";
import { random } from "../plan/random.ts";
import {
  addDays,
  dayLabel,
  mondayOf,
  parseDateKey,
  toDateKey,
  weekFromParam,
} from "../plan/week.ts";
import { LABEL_STYLE } from "../theme.ts";
import { useLiveRecipes } from "./liveRecipes.ts";
import { usePageMenu } from "./pageMenu.ts";
import { usePlanDays } from "./usePlanDays.ts";
import { usePrototypeVariant, useWide } from "../prototype/prototypeStore.ts";

/** Where the unsaved roll is kept, so looking at a recipe and coming back doesn't lose it. */
export const ROLL_STORAGE_KEY = "plan.roll";

/** How long a roll's titles shuffle before they land, in milliseconds. */
export const SHUFFLE_MS = 500;
const SHUFFLE_STEP_MS = 70;

/** The stored roll, or a new one (no picks yet) for the week in `?week=`. */
function startingRoll(weekParam: string | null): Roll {
  const stored = decodeRoll(sessionStorage.getItem(ROLL_STORAGE_KEY));
  if (stored) return stored;
  const monday = weekFromParam(weekParam, new Date());
  const first = toDateKey(monday);
  const last = toDateKey(addDays(monday, 6));
  return { first, last, tags: [], rows: rowsForRange([], first, last) };
}

const labelOf = (date: string) => {
  const day = parseDateKey(date);
  return day ? dayLabel(day) : date;
};

/**
 * The roller (US-5.4): random recipes for a range of days. Lock the ones you like, roll the rest
 * again, skip days that need nothing, then save. Saving only adds meals.
 */
export function RollPage() {
  usePageMenu("Roll");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const live = useLiveRecipes();
  const reduceMotion = useReducedMotion();
  const [roll, setRoll] = useState<Roll>(() => startingRoll(params.get("week")));
  const [shuffling, setShuffling] = useState(false);
  /** Counts up while shuffling; picks which titles flick past. */
  const [tick, setTick] = useState(0);

  const recipes = live.status === "ready" ? live.recipes : null;
  const nearby = noRepeatWindow(roll.first, roll.last);
  const plan = usePlanDays(nearby.first, nearby.last);
  const planned = plan.status === "ready" ? plannedRecipes(plan.days) : null;
  const pool = recipes ? rollPool(recipes, roll.tags) : [];

  // Kept in sessionStorage, so looking at a recipe and coming back doesn't lose the roll.
  // Save and Discard remove it as they leave the page.
  useEffect(() => {
    sessionStorage.setItem(ROLL_STORAGE_KEY, encodeRoll(roll));
  }, [roll]);

  // Rolled days without a pick (a new roll, or days added to the range) get one as soon as the
  // recipes and the nearby Plan days are known.
  const needsPicks =
    recipes !== null &&
    planned !== null &&
    pool.length > 0 &&
    roll.rows.some((row) => row.state === "rolled" && row.recipeId === null);
  // Set while rendering (React's pattern for state that follows other data): the next render has
  // the picks, so needsPicks is false again.
  if (needsPicks) {
    const rows = rollRows(
      roll.rows,
      pool,
      planned,
      random,
      (row) => row.state === "rolled" && row.recipeId === null,
    );
    setRoll({ ...roll, rows });
  }

  useEffect(() => {
    if (!shuffling) return;
    const step = setInterval(() => setTick((count) => count + 1), SHUFFLE_STEP_MS);
    const stop = setTimeout(() => setShuffling(false), SHUFFLE_MS);
    return () => {
      clearInterval(step);
      clearTimeout(stop);
    };
  }, [shuffling]);

  const rollAgain = () => {
    if (planned === null) return;
    setRoll({ ...roll, rows: rollRows(roll.rows, pool, planned, random) });
    if (!reduceMotion) setShuffling(true);
  };

  const setRange = (first: string, last: string, changed: "first" | "last") => {
    if (!parseDateKey(changed === "first" ? first : last)) return;
    const range = clampRange(first, last, changed);
    setRoll({ ...roll, ...range, rows: rowsForRange(roll.rows, range.first, range.last) });
  };

  const setRow = (date: string, state: RollRow["state"]) =>
    setRoll({
      ...roll,
      rows: roll.rows.map((row) => (row.date === date ? { ...row, state } : row)),
    });

  const finish = () => {
    sessionStorage.removeItem(ROLL_STORAGE_KEY);
    const week = toDateKey(mondayOf(parseDateKey(roll.first) ?? new Date()));
    // Replace the roller in history: Back from the Plan doesn't reopen a finished roll.
    void navigate(`/plan?week=${week}`, { replace: true });
  };

  const additions = rollAdditions(roll.rows);
  const save = () => {
    // Not awaited: offline, the write only settles once the device is back online. The batch is
    // all or nothing, so a failure leaves the Plan as it was.
    saveRoll(additions).catch((cause: unknown) => console.error("Couldn't save the roll", cause));
    finish();
  };

  const recipeById = new Map((recipes ?? []).map((recipe) => [recipe.id, recipe]));
  const chips = recipes ? tagChips(recipes, false) : [];

  // PROTOTYPE (US-10.1): the week grid on wide screens.
  const wide = useWide();
  const rollLayout = usePrototypeVariant({
    key: "roll.layout",
    label: "Roll",
    options: [
      { value: "grid", label: "Week grid" },
      { value: "list", label: "List (today)" },
    ],
  });
  if (wide && rollLayout === "grid") {
    const rowByDate = new Map(roll.rows.map((row, index) => [row.date, { row, index }]));
    const firstDay = parseDateKey(roll.first) ?? new Date();
    const lastDay = parseDateKey(roll.last) ?? firstDay;
    const cells: Date[] = [];
    for (let day = mondayOf(firstDay); day <= lastDay || cells.length % 7 !== 0;) {
      cells.push(day);
      day = addDays(day, 1);
    }
    return (
      <Stack gap="md">
        <Stack gap={4} pt="xl" align="center">
          <Title order={1}>Roll</Title>
          <Text c="dimmed" fs="italic" ta="center">
            Lock the meals you like, roll the rest again.
          </Text>
        </Stack>
        <Group
          role="group"
          aria-label="Roll actions"
          justify="space-between"
          align="flex-end"
          wrap="nowrap"
          py="xs"
          bg="var(--mantine-color-body)"
          style={{
            position: "sticky",
            top: "var(--top-bar, 0px)",
            zIndex: 2,
            borderBottom: "1px solid var(--mantine-color-gray-3)",
          }}
        >
          <Group gap="sm" wrap="nowrap">
            <TextInput
              type="date"
              label="From"
              value={roll.first}
              onChange={(event) => setRange(event.currentTarget.value, roll.last, "first")}
            />
            <TextInput
              type="date"
              label="To"
              value={roll.last}
              onChange={(event) => setRange(roll.first, event.currentTarget.value, "last")}
            />
          </Group>
          <Group gap="sm" wrap="nowrap">
            <Button variant="outline" onClick={rollAgain} disabled={planned === null || shuffling}>
              Roll
            </Button>
            <Button onClick={save} disabled={additions.length === 0 || shuffling}>
              Save
            </Button>
            <Button variant="subtle" onClick={finish}>
              Discard
            </Button>
          </Group>
        </Group>
        {chips.length > 0 && (
          <Group role="group" aria-label="Tags" gap={6}>
            {chips.map((tag) => (
              <Chip
                key={tag}
                value={tag}
                size="xs"
                checked={roll.tags.includes(tag)}
                onChange={(on) =>
                  setRoll({
                    ...roll,
                    tags: on ? [...roll.tags, tag] : roll.tags.filter((t) => t !== tag),
                  })
                }
              >
                {tag}
              </Chip>
            ))}
          </Group>
        )}
        {recipes && pool.length === 0 && (
          <Text c="dimmed" fs="italic" ta="center">
            No recipes have these tags.
          </Text>
        )}
        <Box
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          {cells.map((date) => {
            const key = toDateKey(date);
            const found = rowByDate.get(key);
            if (!found) {
              return (
                <Box
                  key={key}
                  p="xs"
                  bg="gray.0"
                  mih={120}
                  style={{ opacity: 0.6, border: "1px dashed var(--mantine-color-gray-3)" }}
                >
                  <Text ff="heading" fs="italic" c="dimmed">
                    {labelOf(key)}
                  </Text>
                </Box>
              );
            }
            const { row, index } = found;
            return (
              <RollCell
                key={key}
                row={row}
                label={labelOf(key)}
                existing={plan.status === "ready" ? (plan.days[key] ?? []) : []}
                recipeById={recipeById}
                shuffleTitle={
                  shuffling && row.state === "rolled" && pool.length > 0
                    ? recipeById.get(pool[(tick * 7 + index * 13) % pool.length]!)?.title
                    : undefined
                }
                onState={(state) => setRow(row.date, state)}
              />
            );
          })}
        </Box>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Stack gap={4} pt="xl" align="center">
        <Title order={1}>Roll</Title>
        <Text c="dimmed" fs="italic" ta="center">
          Lock the meals you like, roll the rest again.
        </Text>
      </Stack>
      <Group grow>
        <TextInput
          type="date"
          label="From"
          value={roll.first}
          onChange={(event) => setRange(event.currentTarget.value, roll.last, "first")}
        />
        <TextInput
          type="date"
          label="To"
          value={roll.last}
          onChange={(event) => setRange(roll.first, event.currentTarget.value, "last")}
        />
      </Group>
      {chips.length > 0 && (
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
              checked={roll.tags.includes(tag)}
              onChange={(on) =>
                setRoll({
                  ...roll,
                  tags: on ? [...roll.tags, tag] : roll.tags.filter((t) => t !== tag),
                })
              }
              styles={{ label: { flex: "none" } }}
            >
              {tag}
            </Chip>
          ))}
        </Group>
      )}
      {recipes && pool.length === 0 && (
        <Text c="dimmed" fs="italic" ta="center">
          No recipes have these tags.
        </Text>
      )}
      {/* Above the days and sticky, so Roll is in reach however long the range is. Not at the
          bottom: the menu button sits there. */}
      <Group
        role="group"
        aria-label="Roll actions"
        justify="center"
        gap="sm"
        py="xs"
        bg="var(--mantine-color-body)"
        style={{ position: "sticky", top: "var(--top-bar, 0px)", zIndex: 2 }}
      >
        <Button variant="outline" onClick={rollAgain} disabled={planned === null || shuffling}>
          Roll
        </Button>
        <Button onClick={save} disabled={additions.length === 0 || shuffling}>
          Save
        </Button>
        <Button variant="subtle" onClick={finish}>
          Discard
        </Button>
      </Group>
      <Stack gap={0}>
        {roll.rows.map((row, index) => (
          <RollDay
            key={row.date}
            row={row}
            label={labelOf(row.date)}
            existing={plan.status === "ready" ? (plan.days[row.date] ?? []) : []}
            recipeById={recipeById}
            shuffleTitle={
              shuffling && row.state === "rolled" && pool.length > 0
                ? recipeById.get(pool[(tick * 7 + index * 13) % pool.length]!)?.title
                : undefined
            }
            onState={(state) => setRow(row.date, state)}
          />
        ))}
      </Stack>
    </Stack>
  );
}

const THUMB = 44;

/** PROTOTYPE: one day of the roll as a grid cell. */
function RollCell({
  row,
  label,
  existing,
  recipeById,
  shuffleTitle,
  onState,
}: {
  row: RollRow;
  label: string;
  existing: MenuEntry[];
  recipeById: Map<string, StoredRecipe>;
  shuffleTitle: string | undefined;
  onState: (state: RollRow["state"]) => void;
}) {
  const recipe = row.recipeId ? recipeById.get(row.recipeId) : undefined;
  const already = existing.map((entry) =>
    "note" in entry ? entry.note : (recipeById.get(entry.recipeId)?.title ?? "Missing recipe"),
  );
  return (
    <Stack
      component="section"
      aria-label={label}
      data-state={row.state}
      gap={6}
      p="xs"
      style={{
        border: `1px solid ${row.state === "locked" ? "var(--mantine-color-linen-6)" : "var(--mantine-color-gray-3)"}`,
        minWidth: 0,
      }}
    >
      <Text ff="heading" fs="italic" fz={16}>
        {label}
      </Text>
      {already.length > 0 && (
        <Text fz="xs" c="dimmed" lineClamp={2}>
          Planned: {already.join(" · ")}
        </Text>
      )}
      <Box style={{ flex: 1 }}>
        {row.state === "skipped" ? (
          <Text fs="italic" c="dimmed">
            Skipped
          </Text>
        ) : shuffleTitle !== undefined ? (
          <Box aria-hidden>
            <Box bg="gray.1" style={{ aspectRatio: "4 / 3" }} />
            <Text ff="heading" fz={15} c="dimmed" mt={4} lineClamp={2}>
              {shuffleTitle}
            </Text>
          </Box>
        ) : !recipe ? (
          <Text fs="italic" c="dimmed">
            Nothing to pick
          </Text>
        ) : (
          <UnstyledButton component={Link} to={`/recipe/${recipe.id}`} w="100%">
            {recipe.thumbnail ? (
              <Image src={recipe.thumbnail} alt="" fit="cover" style={{ aspectRatio: "4 / 3" }} />
            ) : (
              <Box bg="gray.1" style={{ aspectRatio: "4 / 3" }} />
            )}
            <Text ff="heading" fz={15} lh={1.25} mt={4} lineClamp={2}>
              {recipe.title}
            </Text>
          </UnstyledButton>
        )}
      </Box>
      <Group gap={4} grow>
        <Button
          size="compact-xs"
          variant={row.state === "locked" ? "filled" : "subtle"}
          aria-pressed={row.state === "locked"}
          aria-label={`Lock ${label}`}
          disabled={row.state !== "locked" && !recipe}
          onClick={() => onState(row.state === "locked" ? "rolled" : "locked")}
        >
          Lock
        </Button>
        <Button
          size="compact-xs"
          variant={row.state === "skipped" ? "filled" : "subtle"}
          color="gray"
          aria-pressed={row.state === "skipped"}
          aria-label={`Skip ${label}`}
          onClick={() => onState(row.state === "skipped" ? "rolled" : "skipped")}
        >
          Skip
        </Button>
      </Group>
    </Stack>
  );
}

function RollDay({
  row,
  label,
  existing,
  recipeById,
  shuffleTitle,
  onState,
}: {
  row: RollRow;
  label: string;
  /** What the day already has on the Plan. */
  existing: MenuEntry[];
  recipeById: Map<string, StoredRecipe>;
  /** A random title to show while shuffling, instead of the pick. */
  shuffleTitle: string | undefined;
  onState: (state: RollRow["state"]) => void;
}) {
  const recipe = row.recipeId ? recipeById.get(row.recipeId) : undefined;
  const already = existing.map((entry) =>
    "note" in entry ? entry.note : (recipeById.get(entry.recipeId)?.title ?? "Missing recipe"),
  );
  return (
    <Box
      component="section"
      aria-label={label}
      data-state={row.state}
      py="sm"
      px="xs"
      style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}
    >
      <Group justify="space-between" wrap="nowrap" mb={4}>
        <Text ff="heading" fs="italic" fz={18}>
          {label}
        </Text>
        <Group gap={4} wrap="nowrap">
          <Button
            size="compact-xs"
            variant={row.state === "locked" ? "filled" : "subtle"}
            aria-pressed={row.state === "locked"}
            aria-label={`Lock ${label}`}
            disabled={row.state !== "locked" && !recipe}
            onClick={() => onState(row.state === "locked" ? "rolled" : "locked")}
          >
            Lock
          </Button>
          <Button
            size="compact-xs"
            variant={row.state === "skipped" ? "filled" : "subtle"}
            color="gray"
            aria-pressed={row.state === "skipped"}
            aria-label={`Skip ${label}`}
            onClick={() => onState(row.state === "skipped" ? "rolled" : "skipped")}
          >
            Skip
          </Button>
        </Group>
      </Group>
      {already.length > 0 && (
        <Text fz="xs" c="dimmed" mb={4}>
          Planned: {already.join(" · ")}
        </Text>
      )}
      {row.state === "skipped" ? (
        <Text fs="italic" c="dimmed" py={4}>
          Skipped
        </Text>
      ) : shuffleTitle !== undefined ? (
        <Group gap="sm" wrap="nowrap" aria-hidden>
          <Box bg="gray.1" w={THUMB} h={THUMB} style={{ flex: "none" }} />
          <Text ff="heading" fz={17} c="dimmed">
            {shuffleTitle}
          </Text>
        </Group>
      ) : !recipe ? (
        <Text fs="italic" c="dimmed" py={4}>
          Nothing to pick
        </Text>
      ) : (
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
              {row.state === "locked" && (
                <Text c="linen.6" style={LABEL_STYLE}>
                  Locked
                </Text>
              )}
            </Stack>
          </Group>
        </UnstyledButton>
      )}
    </Box>
  );
}
