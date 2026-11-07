import { MantineProvider, TagsInput, Textarea, TextInput } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { theme } from "./theme.ts";
import classes from "./theme.module.css";

// The touch-screen 16px rule (no iOS zoom on focus) lives on one class from the theme; every kind
// of text field the app uses must get it.
test("every kind of text field gets the no-zoom class from the theme", () => {
  render(
    <MantineProvider theme={theme}>
      <TextInput label="Title" />
      <Textarea label="Method" />
      <TagsInput label="Tags" />
    </MantineProvider>,
  );
  const inputClass = classes.input ?? "";
  expect(inputClass).not.toBe("");
  for (const label of ["Title", "Method"]) {
    expect(screen.getByLabelText(label)).toHaveClass(inputClass);
  }
  // TagsInput's typing field sits inside the styled box and inherits its font size.
  const tags = screen.getAllByLabelText("Tags").find((element) => element.tagName === "INPUT");
  expect(tags).toBeDefined();
  expect(tags?.closest(`.${inputClass}`)).not.toBeNull();
});
