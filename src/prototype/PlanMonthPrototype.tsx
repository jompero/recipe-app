// PROTOTYPE (EPIC-10 / US-10.1): throwaway. The Plan's month view on wide screens.
import { ActionIcon, Box, Button, Group, Image, Menu, Text, UnstyledButton } from "@mantine/core";
import { Link } from "react-router";
import type { MenuEntry } from "../data/menu.ts";
import type { StoredRecipe } from "../data/recipes.ts";
import { addDays, mondayOf, toDateKey } from "../plan/week.ts";
import { monthKey } from "./month.ts";
import { LABEL_STYLE } from "../theme.ts";
import { usePlanDays } from "../components/usePlanDays.ts";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_SHOWN = 3;

/** Monday-first weeks covering the month. */
function monthGrid(first: Date): Date[][] {
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const weeks: Date[][] = [];
  for (let monday = mondayOf(first); monday <= last; monday = addDays(monday, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(monday, i)));
  }
  return weeks;
}

export function PlanMonthPrototype({
  first,
  onMonth,
  recipes,
  todayKey,
  thumbs,
  onAdd,
  onMove,
  onRemove,
}: {
  first: Date;
  onMonth: (first: Date | null) => void;
  recipes: StoredRecipe[] | null;
  todayKey: string;
  thumbs: boolean;
  onAdd: (date: string) => void;
  onMove: (date: string, entry: MenuEntry) => void;
  onRemove: (date: string, entry: MenuEntry) => void;
}) {
  const weeks = monthGrid(first);
  const live = usePlanDays(toDateKey(weeks[0]![0]!), toDateKey(weeks.at(-1)![6]!));
  const byId = new Map((recipes ?? []).map((r) => [r.id, r]));
  const isThisMonth = monthKey(first) === todayKey.slice(0, 7);

  return (
    <Box>
      <Group justify="center" gap="xs" wrap="nowrap" mb="md">
        <ActionIcon
          variant="subtle"
          aria-label="Previous month"
          onClick={() => onMonth(new Date(first.getFullYear(), first.getMonth() - 1, 1))}
        >
          ‹
        </ActionIcon>
        <Text ff="heading" fs="italic" fz={22} miw={220} ta="center">
          {MONTHS[first.getMonth()]} {first.getFullYear()}
        </Text>
        <ActionIcon
          variant="subtle"
          aria-label="Next month"
          onClick={() => onMonth(new Date(first.getFullYear(), first.getMonth() + 1, 1))}
        >
          ›
        </ActionIcon>
        {!isThisMonth && (
          <Button variant="subtle" size="compact-xs" onClick={() => onMonth(null)}>
            Today
          </Button>
        )}
      </Group>
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          borderTop: "1px solid var(--mantine-color-gray-3)",
          borderLeft: "1px solid var(--mantine-color-gray-3)",
        }}
      >
        {WEEKDAYS.map((day) => (
          <Text
            key={day}
            c="dimmed"
            ta="center"
            py={6}
            style={{
              ...LABEL_STYLE,
              borderRight: "1px solid var(--mantine-color-gray-3)",
              borderBottom: "1px solid var(--mantine-color-gray-3)",
            }}
          >
            {day}
          </Text>
        ))}
        {weeks.flat().map((date) => {
          const key = toDateKey(date);
          const inMonth = date.getMonth() === first.getMonth();
          const isToday = key === todayKey;
          const isPast = key < todayKey;
          const entries = live.status === "ready" ? (live.days[key] ?? []) : [];
          const extra = entries.length - MAX_SHOWN;
          return (
            <Box
              key={key}
              aria-label={key}
              p={6}
              mih={thumbs ? 132 : 112}
              style={{
                borderRight: "1px solid var(--mantine-color-gray-3)",
                borderBottom: "1px solid var(--mantine-color-gray-3)",
                background: inMonth ? undefined : "var(--mantine-color-gray-0)",
                opacity: isPast ? 0.55 : 1,
                boxShadow: isToday ? "inset 0 3px 0 var(--mantine-color-linen-6)" : undefined,
                minWidth: 0,
              }}
            >
              <Group justify="space-between" wrap="nowrap" gap={2}>
                <Text
                  ff="heading"
                  fs="italic"
                  fz={16}
                  c={isToday ? "linen.6" : inMonth ? undefined : "dimmed"}
                >
                  {date.getDate()}
                </Text>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  aria-label={`Add to ${key}`}
                  onClick={() => onAdd(key)}
                >
                  +
                </ActionIcon>
              </Group>
              {entries.slice(0, MAX_SHOWN).map((entry) => (
                <MonthEntry
                  key={entry.id}
                  entry={entry}
                  recipe={"recipeId" in entry ? byId.get(entry.recipeId) : undefined}
                  thumbs={thumbs}
                  onMove={() => onMove(key, entry)}
                  onRemove={() => onRemove(key, entry)}
                />
              ))}
              {extra > 0 && (
                <Text c="dimmed" mt={2} style={{ ...LABEL_STYLE, fontSize: 9 }}>
                  +{extra} more
                </Text>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function MonthEntry({
  entry,
  recipe,
  thumbs,
  onMove,
  onRemove,
}: {
  entry: MenuEntry;
  recipe: StoredRecipe | undefined;
  thumbs: boolean;
  onMove: () => void;
  onRemove: () => void;
}) {
  const isNote = "note" in entry;
  const name = isNote ? entry.note : (recipe?.title ?? "Missing recipe");
  const label = (
    <Group gap={6} wrap="nowrap" mt={4}>
      {thumbs &&
        !isNote &&
        (recipe?.thumbnail ? (
          <Image src={recipe.thumbnail} alt="" w={26} h={26} fit="cover" style={{ flex: "none" }} />
        ) : (
          <Box bg="gray.1" w={26} h={26} style={{ flex: "none" }} />
        ))}
      <Text
        fz={13}
        lh={1.25}
        fs={isNote ? "italic" : undefined}
        c={isNote ? "dimmed" : undefined}
        ff={isNote ? undefined : "heading"}
        style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}
        title={name}
      >
        {name}
      </Text>
    </Group>
  );
  return (
    <Group gap={0} wrap="nowrap" className="month-entry">
      <Box style={{ flex: 1, minWidth: 0 }}>
        {recipe ? (
          <UnstyledButton component={Link} to={`/recipe/${recipe.id}`} w="100%">
            {label}
          </UnstyledButton>
        ) : (
          label
        )}
      </Box>
      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            mt={4}
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
          <Menu.Label>(Scale: same as the week view)</Menu.Label>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
