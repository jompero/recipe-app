import {
  Box,
  Button,
  Group,
  Image,
  Modal,
  Stack,
  Tabs,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useState } from "react";
import { DEFAULT_STATE, selectRecipes } from "../cookbook/cookbook.ts";
import type { NewMenuEntry } from "../data/menu.ts";
import type { StoredRecipe } from "../data/recipes.ts";
import { NOTE_MAX, noteProblem } from "../plan/note.ts";

/** "+" on a Plan day: pick a recipe from the cookbook, or write a short note. */
export function AddEntrySheet({
  opened,
  dayLabel,
  recipes,
  onAdd,
  onClose,
}: {
  opened: boolean;
  /** The day, as in its heading: "Wed 4 Nov". */
  dayLabel: string;
  recipes: StoredRecipe[];
  onAdd: (entry: NewMenuEntry) => void;
  onClose: () => void;
}) {
  const isPhone = useMediaQuery("(max-width: 48em)") ?? false;
  return (
    // Full screen on a phone, and the long recipe list scrolls with the sheet itself: a scroll box
    // nested inside the sheet didn't respond to touch on a phone (US-5.2 review).
    <Modal opened={opened} onClose={onClose} title={`Add to ${dayLabel}`} fullScreen={isPhone}>
      {/* Mounted only while open, so the search and note start empty each time. */}
      {opened && (
        <Tabs defaultValue="recipe">
          <Tabs.List grow mb="md">
            <Tabs.Tab value="recipe">Recipe</Tabs.Tab>
            <Tabs.Tab value="note">Note</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="recipe">
            <RecipePicker recipes={recipes} onPick={(recipeId) => onAdd({ recipeId })} />
          </Tabs.Panel>
          <Tabs.Panel value="note">
            <NoteForm onAdd={(note) => onAdd({ note })} />
          </Tabs.Panel>
        </Tabs>
      )}
    </Modal>
  );
}

const THUMB = 36;

/** Search over the recipes that aren't archived, with the cookbook's matching. */
function RecipePicker({
  recipes,
  onPick,
}: {
  recipes: StoredRecipe[];
  onPick: (recipeId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const shown = selectRecipes(recipes, { ...DEFAULT_STATE, q: query });
  return (
    <Stack gap="sm">
      <TextInput
        type="search"
        aria-label="Search recipes"
        placeholder="Search"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        data-autofocus
      />
      {shown.length === 0 ? (
        <Text fs="italic" c="dimmed" ta="center" py="md">
          No recipes match
        </Text>
      ) : (
        <Stack component="ul" gap={2} p={0} m={0} style={{ listStyle: "none" }}>
          {shown.map((recipe) => (
            <li key={recipe.id}>
              <UnstyledButton onClick={() => onPick(recipe.id)} w="100%" py={6}>
                <Group gap="sm" wrap="nowrap">
                  {recipe.thumbnail ? (
                    <Image src={recipe.thumbnail} alt="" w={THUMB} h={THUMB} fit="cover" />
                  ) : (
                    <Box bg="gray.1" w={THUMB} h={THUMB} style={{ flex: "none" }} />
                  )}
                  <Text ff="heading" fz={17} lh={1.25}>
                    {recipe.title}
                  </Text>
                </Group>
              </UnstyledButton>
            </li>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function NoteForm({ onAdd }: { onAdd: (note: string) => void }) {
  const [note, setNote] = useState("");
  const problem = noteProblem(note);
  // Empty is the starting state, not a mistake: only say why when the note is too long.
  const tooLong = note.trim().length > NOTE_MAX;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!problem) onAdd(note.trim());
      }}
    >
      <Stack gap="sm">
        <TextInput
          label="Note"
          placeholder="Leftovers, eating out…"
          value={note}
          onChange={(event) => setNote(event.currentTarget.value)}
          error={tooLong ? problem : undefined}
          description={`${String(note.trim().length)} / ${String(NOTE_MAX)}`}
          data-autofocus
        />
        <Button type="submit" disabled={problem !== null}>
          Add
        </Button>
      </Stack>
    </form>
  );
}
