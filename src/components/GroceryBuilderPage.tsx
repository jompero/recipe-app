import {
  Button,
  Checkbox,
  Group,
  Modal,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { addLines, replaceList, type NewSourceLine } from "../data/groceries.ts";
import type { RecipeEntry } from "../data/menu.ts";
import type { StoredRecipe } from "../data/recipes.ts";
import { defaultRange, linesFor, type PickedEntry } from "../groceries/build.ts";
import { clampRange, datesBetween } from "../plan/roll.ts";
import { scaleLabel } from "../plan/scale.ts";
import { dayLabel, parseDateKey, weekFromParam } from "../plan/week.ts";
import { LABEL_STYLE } from "../theme.ts";
import { useGroceryList } from "./useGroceryList.ts";
import { useLiveRecipes } from "./liveRecipes.ts";
import { usePageMenu } from "./pageMenu.ts";
import { usePlanDays } from "./usePlanDays.ts";

/** One planned recipe in the range, with its recipe (undefined if it no longer exists). */
interface PlannedRecipe {
  date: string;
  entry: RecipeEntry;
  recipe: StoredRecipe | undefined;
}

/**
 * The grocery list builder (US-6.4): pick a range of Plan days, untick meals you don't need to shop
 * for, and build the shared list from the rest (replacing it, or adding to it).
 */
export function GroceryBuilderPage() {
  usePageMenu("New grocery list");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [range, setRangeState] = useState(() => {
    const today = new Date();
    return defaultRange(today, weekFromParam(params.get("week"), today));
  });
  const live = usePlanDays(range.first, range.last);
  const recipes = useLiveRecipes();
  const groceries = useGroceryList();
  /** Planned entries the member unticked; any other entry in the range is ticked. */
  const [unticked, setUnticked] = useState<ReadonlySet<string>>(new Set());
  const [asking, setAsking] = useState(false);

  const setRange = (first: string, last: string, changed: "first" | "last") => {
    if (!parseDateKey(changed === "first" ? first : last)) return;
    setRangeState(clampRange(first, last, changed));
  };

  const ready = live.status === "ready" && recipes.status === "ready";
  const recipeById = new Map(
    (recipes.status === "ready" ? recipes.recipes : []).map((recipe) => [recipe.id, recipe]),
  );
  const planned: PlannedRecipe[] =
    live.status === "ready"
      ? datesBetween(range.first, range.last).flatMap((date) =>
          (live.days[date] ?? []).flatMap((entry) =>
            "recipeId" in entry ? [{ date, entry, recipe: recipeById.get(entry.recipeId) }] : [],
          ),
        )
      : [];
  const picked: PickedEntry[] = planned.flatMap(({ entry, recipe }) =>
    recipe && !unticked.has(entry.id) ? [{ entry, recipe }] : [],
  );
  const onList = groceries.status === "ready" ? groceries.list.lines : null;

  const toggle = (id: string, on: boolean) => {
    const next = new Set(unticked);
    if (on) next.delete(id);
    else next.add(id);
    setUnticked(next);
  };

  const write = (save: (lines: NewSourceLine[]) => Promise<unknown>, lines: NewSourceLine[]) => {
    // Not awaited (as on the Plan): offline, the write only settles once the device is back online.
    if (lines.length > 0) {
      save(lines).catch((cause: unknown) => console.error("Couldn't save the grocery list", cause));
    }
    void navigate("/groceries");
  };
  const replace = () => write(replaceList, linesFor(picked, []).lines);
  const add = () => write(addLines, linesFor(picked, onList ?? []).lines);
  const build = () => {
    if (onList && onList.length > 0) setAsking(true);
    else replace();
  };
  const skipped = linesFor(picked, onList ?? []).skipped;

  const days = datesBetween(range.first, range.last).filter((date) =>
    planned.some((item) => item.date === date),
  );

  return (
    <Stack gap="lg">
      <Stack gap={4} pt="xl" align="center">
        <Title order={1}>Grocery list</Title>
        <Text c="dimmed" fs="italic" ta="center">
          Untick the meals you don&apos;t need to shop for.
        </Text>
      </Stack>
      <Group grow>
        <TextInput
          type="date"
          label="From"
          value={range.first}
          onChange={(event) => setRange(event.currentTarget.value, range.last, "first")}
        />
        <TextInput
          type="date"
          label="To"
          value={range.last}
          onChange={(event) => setRange(range.first, event.currentTarget.value, "last")}
        />
      </Group>
      {!ready ? (
        <Skeleton height={120} aria-label="Loading" />
      ) : days.length === 0 ? (
        <Text fs="italic" c="dimmed" ta="center">
          No recipes planned on these days.
        </Text>
      ) : (
        <Stack gap="md">
          {days.map((date) => {
            const label = dayLabel(parseDateKey(date)!);
            return (
              <Stack key={date} gap={6} role="group" aria-label={label}>
                <Text ff="heading" fs="italic" fz={18}>
                  {label}
                </Text>
                {planned
                  .filter((item) => item.date === date)
                  .map(({ entry, recipe }) => (
                    <Checkbox
                      key={entry.id}
                      label={
                        recipe
                          ? `${recipe.title}${entry.scale ? ` ${scaleLabel(entry.scale)}` : ""}`
                          : "Missing recipe"
                      }
                      description={
                        recipe?.archived ? <span style={LABEL_STYLE}>Archived</span> : undefined
                      }
                      disabled={!recipe}
                      checked={recipe !== undefined && !unticked.has(entry.id)}
                      onChange={(event) => toggle(entry.id, event.currentTarget.checked)}
                    />
                  ))}
              </Stack>
            );
          })}
        </Stack>
      )}
      <Button onClick={build} disabled={!ready || onList === null || picked.length === 0}>
        Build list
      </Button>
      <Modal
        opened={asking}
        onClose={() => setAsking(false)}
        title="There's already a list"
        centered
      >
        <Stack gap="md">
          <Text>Replace it, or add these meals to it?</Text>
          {skipped > 0 && (
            <Text c="dimmed" fz="sm">
              {skipped === 1
                ? "1 meal is already on it and won't be added again."
                : `${String(skipped)} meals are already on it and won't be added again.`}
            </Text>
          )}
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setAsking(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={add}>
              Add to it
            </Button>
            <Button onClick={replace}>Replace</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
