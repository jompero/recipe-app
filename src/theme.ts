import { Button, createTheme, Title, type MantineColorsTuple } from "@mantine/core";

// The Nordic cookbook look chosen in the US-3.1 prototype (variant A, "Book"). See the Epic 3
// spec's "Look" section. Fonts are bundled (imported in main.tsx), never loaded from a CDN.

/** Tiny tracked uppercase labels: time, yield, section names. */
export const LABEL_FONT = "'Jost Variable', 'Helvetica Neue', Arial, sans-serif";
const TITLE_FONT = "'Cormorant Variable', Georgia, serif";
const TEXT_FONT = "'EB Garamond Variable', Georgia, serif";

/** The one accent, deep linen green. Shade 6 is the brand colour (#4f5d4a). */
const linen: MantineColorsTuple = [
  "#f2f4f1",
  "#e2e6e0",
  "#c5cdc1",
  "#a6b2a0",
  "#8b9a84",
  "#74846c",
  "#4f5d4a",
  "#435040",
  "#384335",
  "#2c352a",
];

export const theme = createTheme({
  colors: { linen },
  primaryColor: "linen",
  primaryShade: 6,
  black: "#1d1d1b",
  white: "#ffffff",
  defaultRadius: "xs",
  fontFamily: TEXT_FONT,
  fontSizes: { md: "17px" },
  headings: { fontFamily: TITLE_FONT, fontWeight: "500" },
  components: {
    // Titles: centred, letter-spaced, uppercase italic display serif.
    Title: Title.extend({
      styles: {
        root: {
          fontStyle: "italic",
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          textAlign: "center",
        },
      },
    }),
    // Buttons speak in the label voice.
    Button: Button.extend({
      styles: {
        label: {
          fontFamily: LABEL_FONT,
          fontWeight: 400,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          fontSize: 11,
        },
      },
    }),
  },
});
