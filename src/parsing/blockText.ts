// Converts ingredient and instruction lists to and from the text the edit form shows (Epic 3):
// one line per item, `[Header]` lines for sections, a blank line before each header.
import { parseIngredientLine } from "./ingredientLine.ts";
import type { IngredientLine, InstructionLine, SectionHeader } from "./types.ts";

/** Splits text into its non-blank lines, each either a section header or plain content. */
function readLines(text: string): (SectionHeader | { content: string })[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .map((line) => {
      const header = /^\[(.*)\]$/.exec(line)?.[1];
      return header !== undefined ? { header: header.trim() } : { content: line };
    });
}

function writeLines(lines: (SectionHeader | { content: string })[]): string {
  return lines
    .map((line, index) => {
      if (!("header" in line)) return line.content;
      return index === 0 ? `[${line.header}]` : `\n[${line.header}]`;
    })
    .join("\n");
}

export function textToIngredients(text: string): IngredientLine[] {
  return readLines(text).map((line) =>
    "header" in line ? line : parseIngredientLine(line.content),
  );
}

export function ingredientsToText(lines: IngredientLine[]): string {
  return writeLines(lines.map((line) => ("header" in line ? line : { content: line.raw })));
}

export function textToInstructions(text: string): InstructionLine[] {
  return readLines(text).map((line) => ("header" in line ? line : { text: line.content }));
}

export function instructionsToText(lines: InstructionLine[]): string {
  return writeLines(lines.map((line) => ("header" in line ? line : { content: line.text })));
}
