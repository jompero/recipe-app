import {
  Alert,
  Anchor,
  Box,
  Button,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useRef, useState } from "react";
import { Link, useBlocker, useLocation, useNavigate, useParams } from "react-router";
import { tagChips } from "../cookbook/cookbook.ts";
import { createRecipe, updateRecipe, type StoredRecipe } from "../data/recipes.ts";
import {
  draftFromForm,
  EMPTY_FORM,
  formErrors,
  formFromRecipe,
  type RecipeForm,
} from "../editing/recipeForm.ts";
import { LABEL_STYLE } from "../theme.ts";
import { useLiveRecipes } from "./liveRecipes.ts";
import { PhotoField } from "./PhotoField.tsx";
import { usePhotoDraft } from "./usePhotoDraft.ts";

/** The edit form for a recipe (#/recipe/:id/edit), or blank for a new one (#/recipe/new). */
export function EditPage() {
  const { id } = useParams();
  const live = useLiveRecipes();
  if (live.status !== "ready") return null;
  const tags = tagChips(live.recipes, false);

  if (id === undefined) return <EditForm initial={EMPTY_FORM} recipe={null} tags={tags} />;
  const recipe = live.recipes.find((r) => r.id === id);
  if (!recipe) {
    return (
      <Stack align="center" pt="xl">
        <Title order={1}>Recipe not found</Title>
        <Anchor component={Link} to="/" style={LABEL_STYLE}>
          Back to the cookbook
        </Anchor>
      </Stack>
    );
  }
  // Keyed by recipe so the form starts once from the stored recipe, then keeps its own draft
  // while the live data changes underneath (last save wins).
  return <EditForm key={recipe.id} initial={formFromRecipe(recipe)} recipe={recipe} tags={tags} />;
}

function EditForm({
  initial,
  recipe,
  tags,
}: {
  initial: RecipeForm;
  recipe: StoredRecipe | null;
  tags: string[];
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(initial);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const leaving = useRef(false);
  const photo = usePhotoDraft(recipe?.thumbnail ?? null);

  // Leaving with unsaved changes (Cancel, a link, or phone Back) asks first. Saving clears the way.
  const dirty = JSON.stringify(form) !== JSON.stringify(initial) || photo.change !== "keep";
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !leaving.current && currentLocation.pathname !== nextLocation.pathname,
  );

  const errors = formErrors(form);
  const set = (patch: Partial<RecipeForm>) => setForm((current) => ({ ...current, ...patch }));
  const text = (name: keyof RecipeForm) => ({
    value: form[name] as string,
    onChange: (event: { currentTarget: { value: string } }) =>
      set({ [name]: event.currentTarget.value }),
  });

  /** Back to where the form was opened from; a deep link goes to the recipe or the cookbook. */
  const leave = () => {
    if (location.key !== "default") void navigate(-1);
    else void navigate(recipe ? `/recipe/${recipe.id}` : "/", { replace: true });
  };

  const save = async () => {
    if (Object.keys(errors).length > 0) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const draft = draftFromForm(form);
      leaving.current = true;
      if (recipe) {
        await updateRecipe(recipe.id, draft, photo.change);
        leave();
      } else {
        // A new recipe has no stored photo, so its change is "keep" (none) or a new photo.
        const id = await createRecipe(
          draft,
          typeof photo.change === "object" ? photo.change : null,
        );
        void navigate(`/recipe/${id}`, { replace: true });
      }
    } catch (cause) {
      leaving.current = false;
      setSaveError(cause instanceof Error ? cause.message : String(cause));
      setSaving(false);
    }
  };

  return (
    <Stack gap="md" maw={640} mx="auto" pb={80}>
      <Title order={1} pt="xl" fz={24}>
        {recipe ? "Edit recipe" : "New recipe"}
      </Title>
      {saveError && (
        <Alert color="red" title="Couldn't save">
          {saveError}
        </Alert>
      )}
      <TextInput
        label="Title"
        required
        {...text("title")}
        error={showErrors ? errors.title : undefined}
      />
      <PhotoField photo={photo} />
      <Textarea label="Description" autosize minRows={2} {...text("description")} />
      <SimpleGrid cols={2} spacing="sm">
        <TextInput label="Source" {...text("source")} />
        <TextInput label="Source URL" type="url" {...text("sourceUrl")} />
      </SimpleGrid>
      <SimpleGrid cols={3} spacing="sm">
        <TextInput label="Yield" {...text("yield")} />
        <TextInput label="Active time" {...text("activeTime")} />
        <TextInput label="Total time" {...text("totalTime")} />
      </SimpleGrid>
      <TagsInput
        label="Tags"
        data={tags}
        value={form.tags}
        onChange={(value) => set({ tags: value.map((tag) => tag.toLowerCase()) })}
        splitChars={[","]}
        clearable
      />
      <Textarea
        label="Ingredients"
        description="One per line. A line in [brackets] starts a section."
        autosize
        minRows={6}
        {...text("ingredients")}
      />
      <Textarea
        label="Method"
        description="One step per line. A line in [brackets] starts a section."
        autosize
        minRows={6}
        {...text("instructions")}
      />
      <Modal
        opened={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        title="Discard changes?"
        centered
      >
        <Text>Your changes to this recipe haven't been saved.</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="subtle" onClick={() => blocker.reset?.()}>
            Keep editing
          </Button>
          <Button color="red" onClick={() => blocker.proceed?.()}>
            Discard
          </Button>
        </Group>
      </Modal>
      <SaveCancelBar
        saving={saving}
        compressing={photo.busy}
        onSave={() => void save()}
        onCancel={leave}
      />
    </Stack>
  );
}

/** Fixed at the bottom in place of the menu button. */
function SaveCancelBar({
  saving,
  compressing,
  onSave,
  onCancel,
}: {
  saving: boolean;
  /** A photo is still being compressed: saving now would leave it out. */
  compressing: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <Box
      pos="fixed"
      bottom={0}
      left={0}
      right={0}
      p="sm"
      bg="white"
      style={{ borderTop: "1px solid var(--mantine-color-gray-3)", zIndex: 100 }}
    >
      <Group justify="space-between" maw={640} mx="auto">
        <Button variant="subtle" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={onSave} loading={saving} disabled={compressing}>
          Save
        </Button>
      </Group>
    </Box>
  );
}
