// The bookmarklet's landing page, #/import?d=… (EPIC-4, US-4.3): turns the recipe it read from a
// site into a draft and opens the New recipe form with it.
import { Anchor, Stack, Text, Title } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { NewRecipeState } from "../editing/recipeForm.ts";
import { payloadToDraft } from "../import/jsonLd.ts";
import { decodePayload } from "../import/payloadCodec.ts";
import { LABEL_STYLE } from "../theme.ts";

/**
 * Where App.tsx keeps `d` while the member signs in, in case the URL loses it. The import page
 * falls back to it and removes it once read.
 */
export const IMPORT_DATA_KEY = "import.d";

/** The draft for the New recipe form, or null if the data can't be read. */
function readImport(d: string | null): NewRecipeState | null {
  if (!d) return null;
  try {
    const { draft, photoUrl } = payloadToDraft(decodePayload(d));
    return photoUrl ? { draft, photoUrl } : { draft };
  } catch {
    return null;
  }
}

export function ImportPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Read once: the URL is replaced right after, so later renders don't see `d`.
  const [imported] = useState(() =>
    readImport(params.get("d") ?? sessionStorage.getItem(IMPORT_DATA_KEY)),
  );

  // Once only, though StrictMode runs effects twice in development: a second run would add a
  // second form to history.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    sessionStorage.removeItem(IMPORT_DATA_KEY);
    if (!imported) {
      void navigate("/import", { replace: true });
      return;
    }
    // The import URL is replaced by the cookbook, so the long URL leaves history and reload or
    // Back doesn't import again. The form then opens on top of the cookbook, so Cancel and Back
    // ask to discard and land in the app, rather than leaving for the site unasked.
    void (async () => {
      await navigate("/", { replace: true });
      await navigate("/recipe/new", { state: imported });
    })();
  }, [imported, navigate]);

  if (imported) return null;
  return (
    <Stack align="center" pt="xl" px="md" maw={480} mx="auto">
      <Title order={1}>Couldn't read that recipe</Title>
      <Text ta="center">
        The recipe data from the site is missing or damaged. Copy the recipe text on the site and
        use Paste recipe instead.
      </Text>
      <Anchor component={Link} to="/" replace style={LABEL_STYLE}>
        Go to the cookbook
      </Anchor>
    </Stack>
  );
}
