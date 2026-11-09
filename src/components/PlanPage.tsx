import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Group,
  Image,
  Menu,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  addEntry,
  moveEntry,
  removeEntry,
  setEntryScale,
  type EntryScale,
  type MenuEntry,
  type RecipeEntry,
} from "../data/menu.ts";
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
import {
  addMonths,
  firstOfMonth,
  monthFromParam,
  monthKey,
  monthLabel,
  monthWeeks,
  weekForMonth,
} from "../plan/month.ts";
import { scaleLabel } from "../plan/scale.ts";
import { LABEL_STYLE } from "../theme.ts";
import { AddEntrySheet } from "./AddEntrySheet.tsx";
import { useLiveRecipes } from "./liveRecipes.ts";
import { usePageMenu } from "./pageMenu.ts";
import classes from "./PlanPage.module.css";
import { PlanDatePicker } from "./PlanDatePicker.tsx";
import { DraggableItem, PlanDragDrop } from "./planDrag.tsx";
import { QuietToggle } from "./QuietToggle.tsx";
import { useDayDrop } from "./useDayDrop.ts";
import { usePlanDays } from "./usePlanDays.ts";
import { useWide } from "./useWide.ts";

type PlanView = "week" | "month";

/**
 * Which view the URL asks for. The month view is for wide screens only (US-10.9), and opens there
 * when nothing says otherwise; a `?week=` (from the roller or "Add to plan…") still means that week.
 * Phones always get the week.
 */
function viewFrom(params: URLSearchParams, wide: boolean): PlanView {
  if (!wide) return "week";
  const view = params.get("view");
  if (view === "week" || view === "month") return view;
  return params.has("week") ? "week" : "month";
}

/**
 * The Plan (US-5.1, US-5.2): one week, Monday to Sunday, kept live, with the week in the URL. On a
 * wide screen, also a month (US-10.9). Members add recipes and notes to a day, and remove or move
 * entries, and set a recipe's scale for the grocery list (US-6.2).
 */
export function PlanPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const wide = useWide();
  const today = new Date();
  const todayKey = toDateKey(today);
  const view = viewFrom(params, wide);

  const monday = weekFromParam(params.get("week"), today);
  const days = weekDays(monday);
  const month = monthFromParam(params.get("month"), today);
  const weeks = monthWeeks(month);
  const [first, last] =
    view === "month"
      ? [weeks[0]![0]!, weeks.at(-1)![6]!]
      : [toDateKey(monday), toDateKey(days[6]!)];
  const live = usePlanDays(first, last);
  const recipes = useLiveRecipes();
  const isThisWeek = toDateKey(monday) === toDateKey(mondayOf(today));
  const isThisMonth = monthKey(month) === monthKey(today);
  // Roll… and Grocery list… take a week: in the month view, this week or the month's first.
  const handOver = toDateKey(view === "month" ? weekForMonth(month, today) : monday);
  usePageMenu("Plan", [
    { label: "Roll…", to: `/plan/roll?week=${handOver}` },
    { label: "Grocery list…", to: `/groceries/new?week=${handOver}` },
  ]);

  /** The day whose "+" sheet is open. */
  const [addingTo, setAddingTo] = useState<string | null>(null);
  /** The entry whose Move to… picker is open, and its day. */
  const [moving, setMoving] = useState<{ date: string; entry: MenuEntry } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Changing week or month replaces the URL: Back leaves the Plan instead of stepping through.
  const go = (search: string) => void navigate({ search }, { replace: true });
  const goToWeek = (week: Date | null) =>
    go(week ? `?week=${toDateKey(week)}` : wide ? "?view=week" : "");
  const goToMonth = (first: Date | null) =>
    go(first ? `?view=month&month=${monthKey(first)}` : "?view=month");

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

  /** What a day shows and does, in either view. */
  const dayProps = (key: string) => ({
    date: key,
    label: labelOf(key),
    isToday: key === todayKey,
    isPast: key < todayKey,
    entries: live.status === "ready" ? (live.days[key] ?? []) : null,
    recipes: recipes.status === "ready" ? recipes.recipes : null,
    onAdd: () => setAddingTo(key),
    onRemove: (entry: MenuEntry) => save(removeEntry(key, entry)),
    onMove: (entry: MenuEntry) => setMoving({ date: key, entry }),
    onScale: (entry: RecipeEntry, scale: EntryScale) => save(setEntryScale(key, entry, scale)),
  });

  return (
    <Stack gap="lg">
      <Stack gap={4} pt="xl" align="center">
        <Title order={1}>Plan</Title>
        {wide && (
          <QuietToggle
            label="View"
            value={view}
            onChange={(next) =>
              next === "week"
                ? goToWeek(weekForMonth(month, today))
                : goToMonth(firstOfMonth(monday))
            }
            options={[
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
          />
        )}
        <Group gap="xs" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            aria-label={view === "month" ? "Previous month" : "Previous week"}
            onClick={() =>
              view === "month" ? goToMonth(addMonths(month, -1)) : goToWeek(addDays(monday, -7))
            }
          >
            ‹
          </ActionIcon>
          <Text c="dimmed" style={LABEL_STYLE} miw={170} ta="center">
            {view === "month" ? monthLabel(month) : weekLabel(monday)}
          </Text>
          <ActionIcon
            variant="subtle"
            aria-label={view === "month" ? "Next month" : "Next week"}
            onClick={() =>
              view === "month" ? goToMonth(addMonths(month, 1)) : goToWeek(addDays(monday, 7))
            }
          >
            ›
          </ActionIcon>
        </Group>
        {!(view === "month" ? isThisMonth : isThisWeek) && (
          <Button
            variant="subtle"
            size="compact-xs"
            onClick={() => (view === "month" ? goToMonth(null) : goToWeek(null))}
          >
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
      <PlanDragDrop onMove={(from, to, entry) => save(moveEntry(from, to, entry))}>
        {view === "month" ? (
          <MonthGrid
            month={month}
            weeks={weeks}
            dayProps={dayProps}
            onMore={(key) => goToWeek(mondayOf(parseDateKey(key) ?? today))}
          />
        ) : (
          <Stack gap={0}>
            {days.map((date) => {
              const key = toDateKey(date);
              return <PlanDay key={key} {...dayProps(key)} />;
            })}
          </Stack>
        )}
      </PlanDragDrop>
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

/** What a day needs, in the week list or the month grid. */
interface DayProps {
  /** The day's key, YYYY-MM-DD. */
  date: string;
  label: string;
  isToday: boolean;
  isPast: boolean;
  /** null while the days are loading. */
  entries: MenuEntry[] | null;
  /** null while the recipes are loading. */
  recipes: StoredRecipe[] | null;
  onAdd: () => void;
  onRemove: (entry: MenuEntry) => void;
  onMove: (entry: MenuEntry) => void;
  onScale: (entry: RecipeEntry, scale: EntryScale) => void;
}

const WEEKDAY_HEADINGS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** How many entries a month cell shows before "+N more". */
const MONTH_CELL_ENTRIES = 3;

/**
 * The month view (US-10.9): Monday-first weeks, the days of the months either side tinted. Each
 * day has "+" and up to three entries; "+N more" opens that day's week.
 */
function MonthGrid({
  month,
  weeks,
  dayProps,
  onMore,
}: {
  month: Date;
  weeks: string[][];
  dayProps: (key: string) => DayProps;
  onMore: (key: string) => void;
}) {
  const inMonth = monthKey(month);
  return (
    <Box aria-label="Month" className={classes.grid}>
      {WEEKDAY_HEADINGS.map((day) => (
        <Text
          key={day}
          c="dimmed"
          ta="center"
          py={6}
          className={classes.heading}
          style={LABEL_STYLE}
        >
          {day}
        </Text>
      ))}
      {weeks.flat().map((key) => (
        <MonthDay
          key={key}
          dayNumber={Number(key.slice(8))}
          outside={key.slice(0, 7) !== inMonth}
          onMore={() => onMore(key)}
          {...dayProps(key)}
        />
      ))}
    </Box>
  );
}

/** One day of the month grid. */
function MonthDay({
  dayNumber,
  outside,
  onMore,
  date,
  label,
  isToday,
  isPast,
  entries,
  recipes,
  onAdd,
  onRemove,
  onMove,
  onScale,
}: DayProps & { dayNumber: number; outside: boolean; onMore: () => void }) {
  const extra = (entries?.length ?? 0) - MONTH_CELL_ENTRIES;
  const { ref: dropRef, isDropTarget } = useDayDrop(date);
  return (
    <Box
      component="section"
      ref={dropRef}
      aria-label={label}
      aria-current={isToday ? "date" : undefined}
      data-past={isPast || undefined}
      data-outside={outside || undefined}
      data-drop-target={isDropTarget || undefined}
      className={`${classes.cell} ${classes.day}`}
    >
      <Group justify="space-between" wrap="nowrap" gap={2}>
        <Text
          ff="heading"
          fs="italic"
          fz={16}
          c={isToday ? "linen.6" : outside ? "dimmed" : undefined}
        >
          {dayNumber}
        </Text>
        <ActionIcon
          size="sm"
          variant="subtle"
          color="gray"
          aria-label={`Add to ${label}`}
          onClick={onAdd}
          className={classes.control}
        >
          +
        </ActionIcon>
      </Group>
      {entries === null ? (
        <Skeleton height={26} mt={4} aria-label="Loading" />
      ) : (
        <Stack component="ul" gap={4} p={0} m={0} mt={4} style={{ listStyle: "none" }}>
          {entries.slice(0, MONTH_CELL_ENTRIES).map((entry) => (
            <DraggableItem key={entry.id} date={date} entry={entry} className={classes.draggable}>
              <Entry
                compact
                entry={entry}
                recipes={recipes}
                onRemove={() => onRemove(entry)}
                onMove={() => onMove(entry)}
                onScale={(scale) => "recipeId" in entry && onScale(entry, scale)}
              />
            </DraggableItem>
          ))}
        </Stack>
      )}
      {extra > 0 && (
        <UnstyledButton onClick={onMore} mt={4} c="dimmed" style={{ ...LABEL_STYLE, fontSize: 9 }}>
          +{extra} more
        </UnstyledButton>
      )}
    </Box>
  );
}

/** One day: its heading and "+", then its entries. Past days are dimmed; today is marked. */
function PlanDay({
  date,
  label,
  isToday,
  isPast,
  entries,
  recipes,
  onAdd,
  onRemove,
  onMove,
  onScale,
}: DayProps) {
  const { ref: dropRef, isDropTarget } = useDayDrop(date);
  return (
    <Box
      component="section"
      ref={dropRef}
      aria-label={label}
      aria-current={isToday ? "date" : undefined}
      data-past={isPast || undefined}
      data-drop-target={isDropTarget || undefined}
      className={classes.day}
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
            <DraggableItem key={entry.id} date={date} entry={entry} className={classes.draggable}>
              <Entry
                entry={entry}
                recipes={recipes}
                onRemove={() => onRemove(entry)}
                onMove={() => onMove(entry)}
                onScale={(scale) => "recipeId" in entry && onScale(entry, scale)}
              />
            </DraggableItem>
          ))}
        </Stack>
      )}
    </Box>
  );
}

const THUMB = 44;

const SCALES: EntryScale[] = [0.5, 1, 2, 3];

/**
 * An entry, with its "…" menu (Move to…, Remove, and for a recipe its scale). Compact in a month
 * cell: a small photo and one line of title, the menu over its end until hovered on a mouse.
 */
function Entry({
  compact = false,
  entry,
  recipes,
  onRemove,
  onMove,
  onScale,
}: {
  compact?: boolean;
  entry: MenuEntry;
  recipes: StoredRecipe[] | null;
  onRemove: () => void;
  onMove: () => void;
  onScale: (scale: EntryScale) => void;
}) {
  const recipe =
    "recipeId" in entry && recipes
      ? recipes.find((candidate) => candidate.id === entry.recipeId)
      : undefined;
  const name = "note" in entry ? entry.note : (recipe?.title ?? "Missing recipe");
  return (
    <Group
      gap={compact ? 2 : "xs"}
      wrap="nowrap"
      justify="space-between"
      className={compact ? classes.entry : undefined}
    >
      <Box style={{ flex: 1, minWidth: 0 }}>
        <EntryContent
          compact={compact}
          entry={entry}
          recipe={recipe}
          recipesLoading={recipes === null}
        />
      </Box>
      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <ActionIcon
            variant="subtle"
            color="gray"
            size={compact ? "sm" : undefined}
            className={compact ? classes.entryMenu : undefined}
            aria-label={`Options for ${name}`}
          >
            ⋯
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={onMove}>Move to…</Menu.Item>
          <Menu.Item color="red" onClick={onRemove}>
            Remove
          </Menu.Item>
          {"recipeId" in entry && (
            <>
              <Menu.Divider />
              <Menu.Label id={`scale-${entry.id}`}>Scale</Menu.Label>
              {/* Mantine forces role="menuitem" on menu items, so the scale is a radio group. */}
              <Box px="xs" pb={6}>
                <SegmentedControl
                  role="radiogroup"
                  aria-labelledby={`scale-${entry.id}`}
                  size="xs"
                  fullWidth
                  data={SCALES.map((scale) => ({ value: String(scale), label: scaleLabel(scale) }))}
                  value={String(entry.scale ?? 1)}
                  onChange={(value) => onScale(Number(value) as EntryScale)}
                />
              </Box>
            </>
          )}
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}

const COMPACT_THUMB = 26;

/** One line of title in a month cell. */
const oneLine = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const;

function EntryContent({
  compact,
  entry,
  recipe,
  recipesLoading,
}: {
  compact: boolean;
  entry: MenuEntry;
  recipe: StoredRecipe | undefined;
  recipesLoading: boolean;
}) {
  if (compact) {
    if ("note" in entry) {
      return (
        <Text fz={13} lh={1.3} fs="italic" c="dimmed" style={oneLine} title={entry.note}>
          {entry.note}
        </Text>
      );
    }
    if (recipesLoading) return <Skeleton height={COMPACT_THUMB} />;
    const title = recipe?.title ?? "Missing recipe";
    const line = (
      <Group gap={6} wrap="nowrap">
        {recipe?.thumbnail ? (
          <Image
            src={recipe.thumbnail}
            alt=""
            w={COMPACT_THUMB}
            h={COMPACT_THUMB}
            fit="cover"
            style={{ flex: "none" }}
          />
        ) : (
          <Box bg="gray.1" w={COMPACT_THUMB} h={COMPACT_THUMB} style={{ flex: "none" }} />
        )}
        <Text
          ff={recipe ? "heading" : undefined}
          c={recipe ? undefined : "dimmed"}
          fz={13}
          lh={1.3}
          miw={0}
          style={oneLine}
          title={title}
        >
          {title}
          {entry.scale && ` ${scaleLabel(entry.scale)}`}
        </Text>
      </Group>
    );
    return recipe ? (
      <UnstyledButton
        component={Link}
        to={`/recipe/${recipe.id}`}
        w="100%"
        display="block"
        draggable={false}
      >
        {line}
      </UnstyledButton>
    ) : (
      line
    );
  }
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
    <UnstyledButton component={Link} to={`/recipe/${recipe.id}`} w="100%" draggable={false}>
      <Group gap="sm" wrap="nowrap">
        {recipe.thumbnail ? (
          <Image src={recipe.thumbnail} alt="" w={THUMB} h={THUMB} fit="cover" radius="xs" />
        ) : (
          <Box bg="gray.1" w={THUMB} h={THUMB} style={{ flex: "none" }} />
        )}
        <Stack gap={0}>
          <Group gap={6} wrap="nowrap" align="baseline">
            <Text ff="heading" fz={17} lh={1.25}>
              {recipe.title}
            </Text>
            {entry.scale && (
              <Text c="linen.6" style={LABEL_STYLE}>
                {scaleLabel(entry.scale)}
              </Text>
            )}
          </Group>
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
