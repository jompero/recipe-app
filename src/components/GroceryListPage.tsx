import {
  ActionIcon,
  Alert,
  Anchor,
  Box,
  Button,
  Checkbox,
  Group,
  Modal,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import {
  addHandLine,
  clearList,
  HAND_LINE_MAX,
  removeLines,
  tick,
  untick,
} from "../data/groceries.ts";
import type { EntryScale } from "../data/menu.ts";
import { groupByRecipe, type RecipeGroup } from "../groceries/groupByRecipe.ts";
import { mergeLines } from "../groceries/mergeLines.ts";
import type { MergedLine, SourceLine } from "../groceries/types.ts";
import { parseIngredientLine } from "../parsing/ingredientLine.ts";
import { scaleIngredient } from "../parsing/scale.ts";
import { scaleLabel } from "../plan/scale.ts";
import { dayLabel, toDateKey } from "../plan/week.ts";
import { LABEL_STYLE } from "../theme.ts";
import { usePageMenu } from "./pageMenu.ts";
import { useGroceryList } from "./useGroceryList.ts";

type View = "merged" | "recipe";
const VIEW_KEY = "recipe-app:grocery-view";

const readView = (): View => (localStorage.getItem(VIEW_KEY) === "recipe" ? "recipe" : "merged");

/** A source line as it reads on the list: its amount times the Plan entry's scale. */
const scaled = (line: SourceLine) => scaleIngredient(parseIngredientLine(line.raw), line.scale);

/** "Changed 17:30" today, "Changed Thu 5 Nov" before. */
function changedLabel(date: Date): string {
  if (toDateKey(date) === toDateKey(new Date())) {
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    return `Changed ${time}`;
  }
  return `Changed ${dayLabel(date)}`;
}

const groupLabel = (group: RecipeGroup) =>
  group.entryId === undefined
    ? "Added by hand"
    : `${group.title ?? "Recipe"}${group.scale && group.scale !== 1 ? ` ${scaleLabel(group.scale as EntryScale)}` : ""}`;

/**
 * The shared grocery list (US-6.5): merged (one line per thing to buy, A–Z) or by recipe. Ticks
 * sync live between members. Members add items by hand, remove lines or recipes, and clear it.
 */
export function GroceryListPage() {
  const live = useGroceryList();
  const [view, setViewState] = useState<View>(readView);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [removing, setRemoving] = useState<RecipeGroup | null>(null);
  usePageMenu("Grocery list", [
    { label: "New list…", to: "/groceries/new" },
    { label: "Clear list", onSelect: () => setConfirmClear(true) },
  ]);

  const setView = (next: View) => {
    localStorage.setItem(VIEW_KEY, next);
    setViewState(next);
  };

  // Not awaited (as on the Plan): offline, a write only settles once the device is back online.
  const save = (write: Promise<unknown>) => {
    setSaveError(null);
    write.catch((cause: unknown) =>
      setSaveError(cause instanceof Error ? cause.message : String(cause)),
    );
  };

  const list = live.status === "ready" ? live.list : null;
  const ticked = new Set(list?.ticked ?? []);
  const setTicked = (lines: SourceLine[], on: boolean) => {
    const ids = lines.map((line) => line.id);
    save(on ? tick(ids) : untick(ids));
  };

  return (
    <Stack gap="lg">
      <Stack gap={4} pt="xl" align="center">
        <Title order={1}>Grocery list</Title>
        {list?.updatedAt && list.lines.length > 0 && (
          <Text c="dimmed" fs="italic">
            {changedLabel(list.updatedAt)}
          </Text>
        )}
      </Stack>
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
      {live.status === "loading" ? (
        <Skeleton height={160} aria-label="Loading" />
      ) : live.status === "error" ? (
        <Alert color="red" title="Couldn't load the list">
          {live.message}
        </Alert>
      ) : list && list.lines.length === 0 ? (
        <Text fs="italic" c="dimmed" ta="center">
          No grocery list yet.{" "}
          <Anchor component={Link} to="/groceries/new">
            Build one
          </Anchor>
        </Text>
      ) : (
        list && (
          <>
            <SegmentedControl
              role="radiogroup"
              aria-label="View"
              fullWidth
              data={[
                { value: "merged", label: "Merged" },
                { value: "recipe", label: "By recipe" },
              ]}
              value={view}
              onChange={(value) => setView(value === "recipe" ? "recipe" : "merged")}
            />
            {view === "merged" ? (
              <Stack component="ul" gap={0} p={0} m={0} style={{ listStyle: "none" }}>
                {mergeLines(list.lines).map((line) => (
                  <MergedRow
                    key={line.key}
                    line={line}
                    ticked={ticked}
                    onTick={(on) => setTicked(line.sources, on)}
                    onRemove={(source) => save(removeLines([source]))}
                  />
                ))}
              </Stack>
            ) : (
              <Stack gap="lg">
                {groupByRecipe(list.lines).map((group) => (
                  <Stack
                    key={group.entryId ?? "by-hand"}
                    gap={4}
                    role="group"
                    aria-label={groupLabel(group)}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Text ff="heading" fs="italic" fz={18}>
                        {groupLabel(group)}
                      </Text>
                      {group.entryId !== undefined && (
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          aria-label={`Remove ${group.title ?? "recipe"}`}
                          onClick={() => setRemoving(group)}
                        >
                          ×
                        </ActionIcon>
                      )}
                    </Group>
                    {group.lines.map((line) => (
                      <Checkbox
                        key={line.id}
                        label={scaled(line)}
                        checked={ticked.has(line.id)}
                        onChange={(event) => setTicked([line], event.currentTarget.checked)}
                        styles={{
                          label: ticked.has(line.id)
                            ? {
                                textDecoration: "line-through",
                                color: "var(--mantine-color-dimmed)",
                              }
                            : undefined,
                        }}
                      />
                    ))}
                  </Stack>
                ))}
              </Stack>
            )}
          </>
        )
      )}
      {list && <AddItem onAdd={(raw) => save(addHandLine(raw))} />}
      <Modal
        opened={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear the list?"
        centered
      >
        <Stack gap="md">
          <Text>Every line and tick goes, for every member.</Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={() => {
                setConfirmClear(false);
                save(clearList());
              }}
            >
              Clear
            </Button>
          </Group>
        </Stack>
      </Modal>
      <Modal
        opened={removing !== null}
        onClose={() => setRemoving(null)}
        title={`Remove ${removing?.title ?? "the recipe"} from the list?`}
        centered
      >
        <Group justify="flex-end">
          <Button variant="subtle" onClick={() => setRemoving(null)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => {
              if (removing) save(removeLines(removing.lines));
              setRemoving(null);
            }}
          >
            Remove
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}

/** One merged line: a checkbox for all its sources, and tap to see (and remove) them. */
function MergedRow({
  line,
  ticked,
  onTick,
  onRemove,
}: {
  line: MergedLine;
  ticked: ReadonlySet<string>;
  onTick: (on: boolean) => void;
  onRemove: (source: SourceLine) => void;
}) {
  const [open, setOpen] = useState(false);
  const count = line.sources.filter((source) => ticked.has(source.id)).length;
  const all = count === line.sources.length;
  const some = count > 0 && !all;
  return (
    <Box
      component="li"
      aria-label={line.name}
      data-ticked={all || undefined}
      py={8}
      style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}
    >
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <Checkbox
          aria-label={line.name}
          checked={all}
          indeterminate={some}
          onChange={() => onTick(!all)}
          mt={2}
        />
        <UnstyledButton
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          style={{ flex: 1, minWidth: 0 }}
        >
          <Group
            justify="space-between"
            wrap="nowrap"
            gap="sm"
            style={
              all ? { textDecoration: "line-through", color: "var(--mantine-color-dimmed)" } : {}
            }
          >
            <Text>{line.name}</Text>
            {line.amount && (
              <Text c="dimmed" fz="sm" style={{ whiteSpace: "nowrap" }}>
                {line.amount}
              </Text>
            )}
          </Group>
        </UnstyledButton>
      </Group>
      {open && (
        <Stack gap={4} pl={34} pt={6}>
          {line.sources.map((source) => {
            const text = scaled(source);
            const from = source.title ?? "Added by hand";
            return (
              <Group key={source.id} justify="space-between" wrap="nowrap" gap="xs">
                <Stack gap={0}>
                  <Text fz="sm">{text}</Text>
                  <Text c="dimmed" style={LABEL_STYLE}>
                    {from}
                  </Text>
                </Stack>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  aria-label={`Remove ${text} (${source.title ?? "added by hand"})`}
                  onClick={() => onRemove(source)}
                >
                  ×
                </ActionIcon>
              </Group>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

/** The field for adding an item by hand ("toilet paper", "2 dl cream"). */
function AddItem({ onAdd }: { onAdd: (raw: string) => void }) {
  const [value, setValue] = useState("");
  const text = value.trim();
  const tooLong = text.length > HAND_LINE_MAX;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (text === "" || tooLong) return;
    onAdd(text);
    setValue("");
  };
  return (
    <form onSubmit={submit}>
      <Group gap="xs" align="flex-end" wrap="nowrap">
        <TextInput
          label="Add an item"
          placeholder="e.g. toilet paper, 2 dl cream"
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          error={tooLong ? `A line can be at most ${String(HAND_LINE_MAX)} characters.` : undefined}
          style={{ flex: 1 }}
        />
        <Button type="submit" disabled={text === "" || tooLong}>
          Add
        </Button>
      </Group>
    </form>
  );
}
