import {
  Accordion,
  Alert,
  Badge,
  Button,
  Divider,
  Group,
  List,
  Modal,
  Progress,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useState, type ChangeEvent } from "react";
import { existingRecipeIds } from "../data/recipes.ts";
import { ExportSection, RestoreSection } from "./BackupSections.tsx";
import { BookmarkletSection } from "./BookmarkletSection.tsx";
import { InstallSection } from "./InstallSection.tsx";
import {
  buildImportPreview,
  type ImportPreview,
  type PreviewRecipe,
} from "../import/pepperplateImport.ts";
import { runImport, type ImportProgress, type ImportResult } from "../import/runImport.ts";
import type { IngredientLine } from "../parsing/types.ts";
import { NeedsConnection } from "./NeedsConnection.tsx";
import { usePageMenu } from "./pageMenu.ts";
import { usePhoneOffline } from "./useOffline.ts";
import { useWide } from "./useWide.ts";

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** A button that opens a folder picker (desktop browsers); the input stays reachable by label. */
function FolderPicker({ label, onPick }: { label: string; onPick: (files: File[]) => void }) {
  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    onPick(Array.from(event.currentTarget.files ?? []));
  };
  return (
    <Button component="label" variant="default">
      {label}
      <input
        type="file"
        multiple
        // Not in React's types, but supported by Chrome, Edge, Firefox and Safari: pick a folder.
        {...{ webkitdirectory: "" }}
        onChange={pick}
        style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
      />
    </Button>
  );
}

function describeIngredient(line: IngredientLine): string | null {
  if ("header" in line) return null;
  const amount =
    line.qty === undefined
      ? undefined
      : `${line.qty}${line.qtyMax === undefined ? "" : `–${line.qtyMax}`}`;
  const parts = [amount, line.unit, line.item].filter((part) => part !== undefined);
  return line.qty === undefined ? "no amount" : parts.join(" · ");
}

/** What the parser made of one recipe, for checking before the import. */
function ParsedRecipe({ recipe }: { recipe: PreviewRecipe["recipe"] }) {
  return (
    <Stack gap="xs">
      <Text fw={600}>Ingredients</Text>
      <List size="sm" listStyleType="none">
        {recipe.ingredients.map((line, index) => (
          <List.Item key={index}>
            {"header" in line ? (
              <Text fw={600} size="sm">
                [{line.header}]
              </Text>
            ) : (
              <>
                <Text size="sm">{line.raw}</Text>
                <Text size="xs" c="dimmed">
                  {describeIngredient(line)}
                </Text>
              </>
            )}
          </List.Item>
        ))}
      </List>
      <Text fw={600}>Instructions</Text>
      <List size="sm" listStyleType="none">
        {recipe.instructions.map((line, index) => (
          <List.Item key={index}>
            {"header" in line ? (
              <Text fw={600} size="sm">
                [{line.header}]
              </Text>
            ) : (
              line.text
            )}
          </List.Item>
        ))}
      </List>
    </Stack>
  );
}

type ImportState =
  | { step: "idle" }
  | { step: "confirming"; replacing: number }
  | { step: "importing"; progress: ImportProgress }
  | { step: "done"; result: ImportResult }
  | { step: "failed"; message: string };

function PepperplateImport() {
  const offline = usePhoneOffline();
  const [recipeFiles, setRecipeFiles] = useState<File[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [state, setState] = useState<ImportState>({ step: "idle" });

  const refreshPreview = async (recipes: File[], photos: File[]) => {
    const texts = await Promise.all(
      recipes.map(async (file) => ({ name: file.name, text: await file.text() })),
    );
    setPreview(
      buildImportPreview(
        texts,
        photos.map((file) => file.name),
      ),
    );
    setState({ step: "idle" });
  };

  const pickRecipes = (files: File[]) => {
    setRecipeFiles(files);
    void refreshPreview(files, photoFiles);
  };
  const pickPhotos = (files: File[]) => {
    setPhotoFiles(files);
    if (recipeFiles.length > 0) void refreshPreview(recipeFiles, files);
  };

  const askToConfirm = async (current: ImportPreview) => {
    try {
      const existing = await existingRecipeIds(current.recipes.map((recipe) => recipe.id));
      setState({ step: "confirming", replacing: existing.length });
    } catch (error) {
      setState({ step: "failed", message: error instanceof Error ? error.message : String(error) });
    }
  };

  const startImport = async (current: ImportPreview) => {
    setState({ step: "importing", progress: { phase: "compressing", done: 0, total: 0 } });
    try {
      const result = await runImport(current, photoFiles, (progress) =>
        setState({ step: "importing", progress }),
      );
      setState({ step: "done", result });
    } catch (error) {
      setState({ step: "failed", message: error instanceof Error ? error.message : String(error) });
    }
  };

  const toCheck = preview?.recipes.filter((recipe) => recipe.warnings.length > 0) ?? [];

  return (
    <Stack>
      <Title order={3}>Import from Pepperplate</Title>
      <Text size="sm" c="dimmed">
        Pick the folder of Pepperplate .txt files and the folder of saved photos. Nothing is saved
        until you confirm.
      </Text>
      <Group>
        <FolderPicker label="Recipe folder" onPick={pickRecipes} />
        <FolderPicker label="Photo folder" onPick={pickPhotos} />
      </Group>

      {preview !== null && (
        <Stack>
          <Text fw={600}>
            {plural(preview.totals.recipes, "recipe", "recipes")}, {preview.totals.withPhoto} with a
            photo
          </Text>
          <Text size="sm">
            {preview.totals.linesWithoutAmount} of {preview.totals.ingredientLines} ingredient lines
            have no amount
          </Text>

          {toCheck.length > 0 && (
            <section aria-label="Recipes to check">
              <Text fw={600} mb="xs">
                Recipes to check ({toCheck.length})
              </Text>
              <Accordion variant="separated">
                {toCheck.map((recipe) => (
                  <Accordion.Item key={recipe.id} value={recipe.id}>
                    <Accordion.Control>
                      <Group gap="xs">
                        <Text>{recipe.recipe.title || recipe.fileName}</Text>
                        {recipe.warnings.map((warning) => (
                          <Badge key={warning} color="orange" variant="light">
                            {warning}
                          </Badge>
                        ))}
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <ParsedRecipe recipe={recipe.recipe} />
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            </section>
          )}

          {state.step === "importing" ? (
            <Stack gap={4}>
              <Text size="sm">
                {state.progress.phase === "compressing" ? "Compressing photos" : "Saving recipes"}:{" "}
                {state.progress.done} of {state.progress.total}
              </Text>
              <Progress
                value={
                  state.progress.total === 0
                    ? 0
                    : (100 * state.progress.done) / state.progress.total
                }
              />
            </Stack>
          ) : (
            <Group>
              <Button
                onClick={() => void askToConfirm(preview)}
                disabled={preview.totals.recipes === 0 || offline}
              >
                Import {plural(preview.totals.recipes, "recipe", "recipes")}
              </Button>
              {offline && <NeedsConnection />}
            </Group>
          )}

          {state.step === "done" && (
            <Alert color="green" title="Done">
              <Text>
                Imported {plural(state.result.saved, "recipe", "recipes")}, {state.result.withPhoto}{" "}
                with a photo.
              </Text>
              {state.result.skippedPhotos.map(({ fileName, reason }) => (
                <Text key={fileName} size="sm">
                  {fileName}: {reason}
                </Text>
              ))}
            </Alert>
          )}
          {state.step === "failed" && (
            <Alert color="red" title="Something went wrong">
              Import failed: {state.message}
            </Alert>
          )}
        </Stack>
      )}

      <Modal
        opened={state.step === "confirming"}
        onClose={() => setState({ step: "idle" })}
        title={`Import ${plural(preview?.totals.recipes ?? 0, "recipe", "recipes")}?`}
      >
        <Stack>
          {state.step === "confirming" && state.replacing > 0 && (
            <Text>
              {state.replacing === 1
                ? "1 recipe already exists and will be replaced; your edits to it will be lost."
                : `${state.replacing} recipes already exist and will be replaced; your edits to them will be lost.`}
            </Text>
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setState({ step: "idle" })}>
              Cancel
            </Button>
            <Button onClick={() => preview !== null && void startImport(preview)}>Import</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

/**
 * Import, export and restore (Epic 2), and the Recipe bookmarklet (US-4.4).
 * Short centred dividers part the sections; wide screens get a 720px column (US-10.3).
 */
export function DataPage() {
  usePageMenu("Data");
  const wide = useWide();
  const divider = <Divider mx={wide ? 120 : 40} />;
  return (
    <Stack gap="xl" pt="xl" maw={wide ? 720 : undefined} mx="auto">
      <Title order={1}>Data</Title>
      <InstallSection />
      {divider}
      <PepperplateImport />
      {divider}
      <ExportSection />
      {divider}
      <RestoreSection />
      {divider}
      <BookmarkletSection />
    </Stack>
  );
}
