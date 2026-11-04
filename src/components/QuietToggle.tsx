import { Group, Text, UnstyledButton } from "@mantine/core";
import { Fragment } from "react";
import { LABEL_STYLE } from "../theme.ts";

/**
 * A quiet choice in the label voice: "A–Z / Newest", the chosen one in ink and
 * underlined, the other muted. Works as a radio group for screen readers.
 */
export function QuietToggle<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <Group role="radiogroup" aria-label={label} gap={8}>
      {options.map((option, i) => {
        const chosen = option.value === value;
        return (
          <Fragment key={option.value}>
            {i > 0 && (
              <Text component="span" c="gray.4" style={LABEL_STYLE} aria-hidden>
                /
              </Text>
            )}
            <UnstyledButton
              role="radio"
              aria-checked={chosen}
              onClick={() => onChange(option.value)}
              c={chosen ? "dark.9" : "dimmed"}
              style={{
                ...LABEL_STYLE,
                textDecoration: chosen ? "underline" : "none",
                textUnderlineOffset: 4,
                textDecorationThickness: 1,
              }}
            >
              {option.label}
            </UnstyledButton>
          </Fragment>
        );
      })}
    </Group>
  );
}
