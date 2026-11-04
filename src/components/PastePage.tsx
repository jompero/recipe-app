import { Button, Stack, Text, Textarea, Title } from "@mantine/core";
import { useState } from "react";
import { useNavigate } from "react-router";
import type { NewRecipeState } from "../editing/recipeForm.ts";
import { pasteToDraft } from "../parsing/pasteText.ts";
import { usePageMenu } from "./pageMenu.ts";

/**
 * The pasted text, kept in this tab so Back from the filled-in form finds it again. The form
 * removes it once the recipe is saved (NewRecipeState.clearOnSave).
 */
const TEXT_KEY = "quickPaste.text";

/** Quick Paste (#/paste, US-4.2): a whole recipe pasted as text becomes a draft in the form. */
export function PastePage() {
  usePageMenu("Paste recipe");
  const navigate = useNavigate();
  const [text, setText] = useState(() => sessionStorage.getItem(TEXT_KEY) ?? "");

  const change = (value: string) => {
    setText(value);
    sessionStorage.setItem(TEXT_KEY, value);
  };

  const makeDraft = () => {
    const state: NewRecipeState = { draft: pasteToDraft(text), clearOnSave: TEXT_KEY };
    void navigate("/recipe/new", { state });
  };

  return (
    <Stack gap="md" maw={640} mx="auto">
      <Title order={1} pt="xl" fz={24}>
        Paste recipe
      </Title>
      <Text c="dimmed">
        Paste a whole recipe: title, ingredients and method. You can check and correct it before
        saving.
      </Text>
      <Textarea
        label="Recipe text"
        autosize
        minRows={12}
        value={text}
        onChange={(event) => change(event.currentTarget.value)}
      />
      <Button onClick={makeDraft} disabled={text.trim() === ""} style={{ alignSelf: "flex-end" }}>
        Make draft
      </Button>
    </Stack>
  );
}
