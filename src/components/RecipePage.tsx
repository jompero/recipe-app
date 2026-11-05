import {
  Alert,
  Anchor,
  Box,
  Button,
  Group,
  Image,
  Modal,
  Notification,
  UnstyledButton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { loadFullImage } from "../data/images.ts";
import { addEntry } from "../data/menu.ts";
import { setArchived, type StoredRecipe } from "../data/recipes.ts";
import { scaleIngredient } from "../parsing/scale.ts";
import type { IngredientLine, InstructionLine, SectionHeader } from "../parsing/types.ts";
import { dayLabel, mondayOf, parseDateKey, toDateKey } from "../plan/week.ts";
import { LABEL_STYLE } from "../theme.ts";
import { useLiveRecipes } from "./liveRecipes.ts";
import { usePageMenu, type PageAction } from "./pageMenu.ts";
import { PlanDatePicker } from "./PlanDatePicker.tsx";
import { QuietToggle } from "./QuietToggle.tsx";
import { useTicks } from "./useTicks.ts";
import { useWakeLock } from "./useWakeLock.ts";

function isHeader(line: IngredientLine | InstructionLine): line is SectionHeader {
  return "header" in line;
}

type Scale = "0.5" | "1" | "2" | "3";
const SCALES: { value: Scale; label: string }[] = [
  { value: "0.5", label: "½" },
  { value: "1", label: "1×" },
  { value: "2", label: "2×" },
  { value: "3", label: "3×" },
];

/**
 * The menu's Archive (asks first, then returns to the cookbook) or Unarchive action, and the
 * confirmation dialog to render.
 */
function useArchive(recipe: StoredRecipe) {
  const navigate = useNavigate();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (archived: boolean) => {
    setError(null);
    setBusy(true);
    try {
      await setArchived(recipe.id, archived);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const action: PageAction = recipe.archived
    ? { label: "Unarchive", onSelect: () => void save(false) }
    : { label: "Archive", onSelect: () => setAsking(true) };

  const confirm = (
    <Modal opened={asking} onClose={() => setAsking(false)} title="Archive this recipe?" centered>
      <Text>
        “{recipe.title}” will be hidden from the cookbook and search. You can bring it back from{" "}
        <em>Show archived</em>.
      </Text>
      <Group justify="flex-end" mt="lg">
        <Button variant="subtle" onClick={() => setAsking(false)}>
          Cancel
        </Button>
        <Button
          loading={busy}
          onClick={() =>
            void save(true).then((saved) => {
              setAsking(false);
              if (saved) void navigate("/");
            })
          }
        >
          Archive
        </Button>
      </Group>
    </Modal>
  );
  return { action, confirm, error };
}

/** How long "Added to …" stays up, in milliseconds. */
const ADDED_NOTICE_MS = 6000;

/**
 * The menu's "Add to plan…" (US-5.3): pick a date, the recipe is added to it, and a short notice
 * links to that week. Offered for archived recipes too.
 */
function useAddToPlan(recipe: StoredRecipe) {
  const [picking, setPicking] = useState(false);
  const [notice, setNotice] = useState<
    { kind: "added"; date: string } | { kind: "error"; message: string } | null
  >(null);

  useEffect(() => {
    if (notice?.kind !== "added") return;
    const timer = setTimeout(() => setNotice(null), ADDED_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const pick = (date: string) => {
    setPicking(false);
    setNotice({ kind: "added", date });
    // Not awaited: offline, the write only settles once the device is back online (as on the Plan).
    addEntry(date, { recipeId: recipe.id }).catch((cause: unknown) =>
      setNotice({ kind: "error", message: cause instanceof Error ? cause.message : String(cause) }),
    );
  };

  const action: PageAction = { label: "Add to plan…", onSelect: () => setPicking(true) };
  const day = notice?.kind === "added" ? parseDateKey(notice.date) : null;
  const ui = (
    <>
      <PlanDatePicker
        opened={picking}
        title="Add to plan"
        start={toDateKey(new Date())}
        onPick={pick}
        onClose={() => setPicking(false)}
      />
      {notice && (
        // Above the menu button, wherever the page is scrolled to.
        <Box
          pos="fixed"
          bottom={84}
          left={16}
          right={16}
          maw={480}
          mx="auto"
          style={{ zIndex: 150 }}
        >
          <Notification
            withBorder
            color={notice.kind === "error" ? "red" : "linen"}
            title={notice.kind === "error" ? "Couldn't add to the plan" : undefined}
            onClose={() => setNotice(null)}
            closeButtonProps={{ "aria-label": "Close" }}
          >
            {notice.kind === "error" ? (
              notice.message
            ) : (
              <>
                Added to {day ? dayLabel(day) : notice.date}.{" "}
                <Anchor
                  component={Link}
                  to={`/plan?week=${day ? toDateKey(mondayOf(day)) : notice.date}`}
                >
                  Show the week
                </Anchor>
              </>
            )}
          </Notification>
        </Box>
      )}
    </>
  );
  return { action, ui };
}

/** The recipe's thumbnail at once, then its full photo once loaded (ADR-0001). */
function usePhoto(recipe: StoredRecipe): string | null {
  const [full, setFull] = useState<{ id: string; url: string } | null>(null);
  useEffect(() => {
    if (!recipe.hasImage) return;
    let current = true;
    void loadFullImage(recipe.id).then((url) => {
      if (current && url) setFull({ id: recipe.id, url });
    });
    return () => {
      current = false;
    };
  }, [recipe.id, recipe.hasImage]);
  return full?.id === recipe.id ? full.url : recipe.thumbnail;
}

/** One recipe on one scrolling page, for cooking from. */
export function RecipePage() {
  const { id } = useParams();
  const live = useLiveRecipes();
  if (live.status !== "ready") return null;
  const recipe = live.recipes.find((r) => r.id === id);
  if (!recipe) {
    return (
      <Stack align="center" pt="xl">
        <Title order={1}>Recipe not found</Title>
        <Text c="dimmed" fs="italic">
          It may have been renamed or the link is wrong.
        </Text>
        <Anchor component={Link} to="/" style={LABEL_STYLE}>
          Back to the cookbook
        </Anchor>
      </Stack>
    );
  }
  return <Recipe recipe={recipe} />;
}

function Recipe({ recipe }: { recipe: StoredRecipe }) {
  const meta = [
    ["Serves", recipe.yield],
    ["Active", recipe.activeTime],
    ["Total", recipe.totalTime],
  ].filter(([, value]) => value);
  const photo = usePhoto(recipe);
  useWakeLock();
  const archive = useArchive(recipe);
  const addToPlan = useAddToPlan(recipe);
  usePageMenu(recipe.title, [
    { label: "Edit recipe", to: `/recipe/${recipe.id}/edit` },
    addToPlan.action,
    archive.action,
  ]);
  const [ticks, toggle] = useTicks(recipe.id);
  // Scaling is for this cook only: never saved.
  const [scale, setScale] = useState<Scale>("1");
  const stepNumbers = numberSteps(recipe.instructions);

  return (
    <Stack gap={0} maw={640} mx="auto">
      {photo && (
        // Full-bleed: out past the page padding on both sides. The height follows the photo's
        // own shape, capped so a tall photo doesn't fill the screen, and never collapses.
        <Image
          src={photo}
          alt=""
          fit="cover"
          mx="calc(var(--mantine-spacing-md) * -1)"
          mt="calc(var(--mantine-spacing-md) * -1)"
          w="calc(100% + 2 * var(--mantine-spacing-md))"
          h="auto"
          mah="70vh"
          mih={180}
          style={{ maxWidth: "none" }}
        />
      )}
      {recipe.archived && (
        <Text ta="center" c="dimmed" pt="xl" style={LABEL_STYLE}>
          Archived
        </Text>
      )}
      {archive.error && (
        <Alert color="red" mt="md" title="Couldn't save">
          {archive.error}
        </Alert>
      )}
      {archive.confirm}
      {addToPlan.ui}
      <Title order={1} pt={recipe.archived ? "xs" : "xl"} fz={28} lh={1.25}>
        {recipe.title}
      </Title>
      {recipe.source && (
        <Text ta="center" c="dimmed" mt="xs" style={LABEL_STYLE}>
          {recipe.sourceUrl ? (
            <Anchor href={recipe.sourceUrl} target="_blank" rel="noreferrer" c="dimmed" inherit>
              {recipe.source}
            </Anchor>
          ) : (
            recipe.source
          )}
        </Text>
      )}
      {recipe.description && (
        <Text ta="center" fs="italic" fz={18} lh={1.5} mt="lg" style={{ whiteSpace: "pre-line" }}>
          {recipe.description}
        </Text>
      )}
      {meta.length > 0 && (
        <Group
          justify="center"
          gap={28}
          mt="xl"
          pt="sm"
          style={{ borderTop: "1px solid currentColor" }}
        >
          {meta.map(([label, value]) => (
            <Box key={label} ta="center">
              <Text c="dimmed" style={LABEL_STYLE}>
                {label}
              </Text>
              <Text fz={15} mt={2}>
                {value}
              </Text>
            </Box>
          ))}
        </Group>
      )}
      {recipe.tags.length > 0 && (
        <Text ta="center" c="linen.6" mt="md" style={LABEL_STYLE}>
          {recipe.tags.join(" · ")}
        </Text>
      )}

      <Group justify="space-between" align="baseline" mt={40} mb="sm">
        <Text component="h2" fw={400} m={0} style={{ ...LABEL_STYLE, fontSize: 11 }}>
          Ingredients
        </Text>
        <QuietToggle label="Scale" value={scale} onChange={setScale} options={SCALES} />
      </Group>
      <Box component="ul" aria-label="Ingredients" p={0} m={0} style={{ listStyle: "none" }}>
        {recipe.ingredients.map((line, i) =>
          isHeader(line) ? (
            <Text key={i} component="li" mt="md" mb={6} style={LABEL_STYLE}>
              {line.header}
            </Text>
          ) : (
            <Box
              key={i}
              component="li"
              style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}
            >
              <Tickable ticked={ticks.has(`i${i}`)} onToggle={() => toggle(`i${i}`)}>
                <Text fz={17} lh={1.45} py={5}>
                  {scaleIngredient(line, Number(scale))}
                </Text>
              </Tickable>
            </Box>
          ),
        )}
      </Box>
      <Text component="h2" mt={40} mb="sm" fw={400} style={{ ...LABEL_STYLE, fontSize: 11 }}>
        Method
      </Text>
      <Box component="ol" aria-label="Method" p={0} m={0} style={{ listStyle: "none" }}>
        {recipe.instructions.map((line, i) => {
          if (isHeader(line)) {
            return (
              <Text key={i} component="li" mt="lg" mb={8} style={LABEL_STYLE}>
                {line.header}
              </Text>
            );
          }
          return (
            <Group key={i} component="li" mb="md" gap={14} wrap="nowrap" align="flex-start">
              <Text
                component="span"
                ff="heading"
                fs="italic"
                fz={22}
                lh={1.1}
                c="linen.6"
                miw={18}
                style={{ flex: "none" }}
              >
                {stepNumbers[i]}
              </Text>
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Tickable ticked={ticks.has(`s${i}`)} onToggle={() => toggle(`s${i}`)}>
                  <Text fz={17} lh={1.55}>
                    {line.text}
                  </Text>
                </Tickable>
              </Box>
            </Group>
          );
        })}
      </Box>
    </Stack>
  );
}

/** A tap-to-tick line: faded and struck through once ticked. */
function Tickable({
  ticked,
  onToggle,
  children,
}: {
  ticked: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <UnstyledButton
      aria-pressed={ticked}
      onClick={onToggle}
      w="100%"
      style={{
        display: "block",
        opacity: ticked ? 0.35 : 1,
        textDecoration: ticked ? "line-through" : "none",
        transition: "opacity 120ms",
      }}
    >
      {children}
    </UnstyledButton>
  );
}

/** Step numbers by line index, counting across section headers (headers get none). */
function numberSteps(lines: InstructionLine[]): (number | null)[] {
  let step = 0;
  return lines.map((line) => (isHeader(line) ? null : ++step));
}
