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
import { useEffect, useRef, useState } from "react";
import { Link, useBlocker, useLocation, useNavigate, useParams } from "react-router";
import { tagChips } from "../cookbook/cookbook.ts";
import { createRecipe, updateRecipe, type StoredRecipe } from "../data/recipes.ts";
import {
  draftFromForm,
  EMPTY_FORM,
  formErrors,
  formFromRecipe,
  newRecipeState,
  type RecipeForm,
} from "../editing/recipeForm.ts";
import { sameRecipeUrl } from "../editing/recipeUrl.ts";
import { LABEL_STYLE } from "../theme.ts";
import { useLiveRecipes } from "./liveRecipes.ts";
import { PhotoField } from "./PhotoField.tsx";
import { usePhoneOffline } from "./useOffline.ts";
import { usePhotoDraft, type PhotoDraft } from "./usePhotoDraft.ts";

/**
 * The edit form for a recipe (#/recipe/:id/edit), or for a new one (#/recipe/new): blank, or
 * filled in from a draft passed in router state (NewRecipeState).
 */
export function EditPage() {
  const { id } = useParams();
  const location = useLocation();
  const live = useLiveRecipes();
  if (live.status !== "ready") return null;
  const tags = tagChips(live.recipes, false);

  if (id === undefined) {
    const passed = newRecipeState(location.state as unknown);
    return (
      <EditForm
        initial={passed ? formFromRecipe(passed.draft) : EMPTY_FORM}
        baseline={EMPTY_FORM}
        recipe={null}
        recipes={live.recipes}
        tags={tags}
        clearOnSave={passed?.clearOnSave}
        photoUrl={passed?.photoUrl}
      />
    );
  }
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
  const stored = formFromRecipe(recipe);
  return (
    <EditForm
      key={recipe.id}
      initial={stored}
      baseline={stored}
      recipe={recipe}
      recipes={live.recipes}
      tags={tags}
    />
  );
}

function EditForm({
  initial,
  baseline,
  recipe,
  recipes,
  tags,
  clearOnSave,
  photoUrl,
}: {
  initial: RecipeForm;
  /** What counts as unchanged: a new recipe filled in from a draft is unsaved from the start. */
  baseline: RecipeForm;
  recipe: StoredRecipe | null;
  /** Every stored recipe, archived ones included, to spot one from the same address. */
  recipes: StoredRecipe[];
  tags: string[];
  /** A sessionStorage key to remove once saved (NewRecipeState). */
  clearOnSave?: string;
  /** A site's photo to try to fetch as the new recipe's photo (NewRecipeState). */
  photoUrl?: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(initial);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const leaving = useRef(false);
  const photo = usePhotoDraft(recipe?.thumbnail ?? null);
  const photoFetch = useSitePhoto(photoUrl, photo);
  const offline = usePhoneOffline();
  // Not while saving: Firestore lists a new recipe before the server confirms the write, so it
  // would show up here as its own duplicate.
  const duplicate = saving
    ? undefined
    : recipes.find(
        (other) => other.id !== recipe?.id && sameRecipeUrl(other.sourceUrl, form.sourceUrl),
      );

  // Leaving with unsaved changes (Cancel, a link, or phone Back) asks first. Saving clears the way.
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline) || photo.change !== "keep";
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
        if (clearOnSave) sessionStorage.removeItem(clearOnSave);
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
      {photoFetch === "fetching" && (
        <Text size="sm" c="dimmed" style={LABEL_STYLE}>
          Fetching the site's photo…
        </Text>
      )}
      {photoFetch === "failed" && photoUrl && (
        <Alert color="yellow" title="No photo yet">
          <Text size="sm">
            {offline
              ? "Needs a connection to fetch the site's photo. Paste one here, or add it later."
              : "Couldn't fetch the photo: copy the image on the site and paste it here"}
          </Text>
          <Anchor href={photoUrl} target="_blank" rel="noopener noreferrer" size="sm">
            Open the image
          </Anchor>
        </Alert>
      )}
      <Textarea label="Description" autosize minRows={2} {...text("description")} />
      <SimpleGrid cols={2} spacing="sm">
        <TextInput label="Source" {...text("source")} />
        <TextInput label="Source URL" type="url" {...text("sourceUrl")} />
      </SimpleGrid>
      {duplicate && (
        <Alert color="blue" title="You already have this recipe">
          <Anchor component={Link} to={`/recipe/${duplicate.id}`} size="sm">
            {duplicate.title}
            {duplicate.archived ? " (archived)" : ""}
          </Anchor>
        </Alert>
      )}
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

/**
 * Tries to fetch a recipe site's photo into the photo draft once. Most sites don't allow it
 * (no CORS header) and there is no proxy (CLAUDE.md), so "failed" is the usual outcome: the form
 * then asks the member to copy and paste the image.
 */
function useSitePhoto(
  photoUrl: string | undefined,
  photo: PhotoDraft,
): "idle" | "fetching" | "failed" {
  const [status, setStatus] = useState<"idle" | "fetching" | "failed">(
    photoUrl ? "fetching" : "idle",
  );
  // The member may pick a photo while this one loads: theirs wins.
  const untouched = useRef(true);
  const { change, busy, stage } = photo;
  useEffect(() => {
    untouched.current = change === "keep" && !busy;
  }, [change, busy]);

  useEffect(() => {
    if (!photoUrl) return;
    const abort = new AbortController();
    fetch(photoUrl, { signal: abort.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const image = await response.blob();
        if (!image.type.startsWith("image/")) throw new Error(`Not an image: ${image.type}`);
        if (abort.signal.aborted) return;
        setStatus("idle");
        if (untouched.current) await stage(image);
      })
      .catch(() => {
        if (!abort.signal.aborted) setStatus("failed");
      });
    return () => abort.abort();
  }, [photoUrl, stage]);

  return status;
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
      // Above the offline strip while it shows (MemberShell sets --offline-strip).
      bottom="var(--offline-strip, 0px)"
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
