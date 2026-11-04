// Quick Paste (US-4.2): splits a whole recipe pasted as text into a draft for the New recipe form.
// Nothing is dropped: every line except headings and recognised label lines ends up in a field.
import { textToIngredients, textToInstructions } from "./blockText.ts";
import { splitAmount } from "./ingredientLine.ts";
import type { RecipeDraft } from "./types.ts";

// ---- Word lists: extend these to recognise more headings and labels. All lowercase. ----

/** Whole-line section headings (English, Danish, Finnish), matched ignoring case and a trailing ":". */
const HEADINGS = {
  ingredients: ["ingredients", "ingredienser", "ainekset", "ainesosat"],
  instructions: [
    "method",
    "instructions",
    "directions",
    "steps",
    "preparation",
    "fremgangsmåde",
    "sådan gør du",
    "tilberedning",
    "valmistus",
    "valmistusohje",
    "ohje",
    "ohjeet",
  ],
  notes: ["notes", "note", "tips", "noter", "vinkit"],
} as const;

/** Labels at the start of a line ("Serves 4", "Prep: 15 min"); the rest of the line is the value. */
const LABELS = {
  yield: [
    "serves",
    "servings",
    "makes",
    "yield",
    "yields",
    "portions",
    "portioner",
    "antal",
    "annokset",
    "annosta",
  ],
  activeTime: [
    "prep",
    "prep time",
    "preparation time",
    "active time",
    "arbejdstid",
    "forberedelse",
    "aktiv tid",
    "valmisteluaika",
    "työaika",
  ],
  totalTime: [
    "total",
    "total time",
    "time",
    "ready in",
    "tid",
    "tid i alt",
    "samlet tid",
    "kokonaisaika",
    "aika",
  ],
} as const;

/** Nouns of a yield written number-first, such as "4 personer" or "Til 4 personer". */
const YIELD_NOUNS = [
  "servings",
  "portions",
  "people",
  "personer",
  "portioner",
  "annosta",
  "hengelle",
];

/** A short line ending in ":" inside a section is a sub-heading, e.g. "For the sauce:". */
const MAX_SUBHEADING_LENGTH = 40;

// ---------------------------------------------------------------------------------------------

type Section = keyof typeof HEADINGS;
type LabelField = keyof typeof LABELS;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Longest first, so "total time" wins over "total" and "time". */
function alternation(words: readonly string[]): string {
  return [...words]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|");
}

const HEADING_OF = new Map<string, Section>(
  (Object.keys(HEADINGS) as Section[]).flatMap((section) =>
    HEADINGS[section].map((word) => [word, section] as const),
  ),
);

const LABEL_FIELD_OF = new Map<string, LabelField>(
  (Object.keys(LABELS) as LabelField[]).flatMap((field) =>
    LABELS[field].map((word) => [word, field] as const),
  ),
);

/** A label, then ":" or a space, then a value with at least one digit. */
const LABEL_LINE = new RegExp(
  `^(${alternation([...LABEL_FIELD_OF.keys()])})(?:\\s*:\\s*|\\s+)(.*\\d.*)$`,
  "i",
);

const YIELD_LINE = new RegExp(
  `^(?:(?:til|for)\\s+)?\\d+(?:\\s*[-–]\\s*\\d+)?\\s+(?:${alternation(YIELD_NOUNS)})\\.?$`,
  "i",
);

/** Several labels on one line, as recipe sites lay them out: "Prep: 10 min | Serves 4". */
const LABEL_SEPARATOR = /\s+[|·•]\s+/;

const BULLET = /^[•\-*–·▢]\s*/;
const STEP_NUMBER = /^\d+[.)]\s+/;

function headingOf(line: string): Section | undefined {
  return HEADING_OF.get(line.replace(/\s*:$/, "").toLowerCase());
}

/** The fields a label line fills, or undefined if any part of it isn't a recognised label. */
function readLabels(line: string): [LabelField, string][] | undefined {
  const labels: [LabelField, string][] = [];
  for (const part of line.split(LABEL_SEPARATOR)) {
    if (YIELD_LINE.test(part)) {
      labels.push(["yield", part]);
      continue;
    }
    const [, label = "", value = ""] = LABEL_LINE.exec(part) ?? [];
    const field = LABEL_FIELD_OF.get(label.toLowerCase());
    if (field === undefined) return undefined;
    labels.push([field, value.trim()]);
  }
  return labels;
}

/** Strips a leading bullet or step number, unless that would leave nothing. */
function clean(line: string): string {
  const stripped = line.replace(BULLET, "").replace(STEP_NUMBER, "");
  return stripped === "" ? line : stripped;
}

/** "For the sauce:" → "[For the sauce]"; any other line is returned as is. */
function asSubheading(line: string): string {
  const header = /^(.+?)\s*:$/.exec(line)?.[1];
  return header !== undefined && line.length <= MAX_SUBHEADING_LENGTH ? `[${header}]` : line;
}

export function pasteToDraft(text: string): RecipeDraft {
  const draft: RecipeDraft = {
    title: "",
    description: "",
    source: "",
    sourceUrl: "",
    yield: "",
    activeTime: "",
    totalTime: "",
    tags: [],
    ingredients: [],
    instructions: [],
  };

  const lines = text
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
  const [title, ...body] = lines;
  if (title === undefined) return draft;
  draft.title = title;

  // Without an ingredients or method heading, lines are sorted by whether they start with an amount.
  const hasHeadings = body.some((line) => {
    const heading = headingOf(line);
    return heading === "ingredients" || heading === "instructions";
  });

  let section: Section | "intro" | "auto" = hasHeadings ? "intro" : "auto";
  const intro: string[] = [];
  const notes: string[] = [];
  const ingredients: string[] = [];
  const instructions: string[] = [];

  /** Fills label fields; false if the line isn't a label line or a field is already filled. */
  function takeLabels(line: string): boolean {
    const labels = readLabels(line);
    if (labels === undefined || labels.some(([field]) => draft[field] !== "")) return false;
    for (const [field, value] of labels) draft[field] = value;
    return true;
  }

  for (const line of body) {
    const heading = headingOf(line);
    if (heading !== undefined) {
      section = heading;
      continue;
    }
    switch (section) {
      case "intro":
        if (!takeLabels(line)) intro.push(line);
        break;
      case "notes":
        if (!takeLabels(line)) notes.push(line);
        break;
      case "ingredients":
        ingredients.push(asSubheading(clean(line)));
        break;
      case "instructions":
        instructions.push(asSubheading(clean(line)));
        break;
      case "auto": {
        if (takeLabels(line)) break;
        // Check the step number first: "1. Mix" would otherwise read as an amount of 1.
        const isStep = STEP_NUMBER.test(line.replace(BULLET, ""));
        const cleaned = clean(line);
        if (!isStep && splitAmount(cleaned) !== null) ingredients.push(cleaned);
        else instructions.push(cleaned);
        break;
      }
    }
  }

  draft.description = [intro.join("\n"), notes.join("\n")]
    .filter((part) => part !== "")
    .join("\n\n");
  draft.ingredients = textToIngredients(ingredients.join("\n"));
  draft.instructions = textToInstructions(instructions.join("\n"));
  return draft;
}
