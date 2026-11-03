import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist", "coverage", ".scratch", "docs", ".claude", ".agents"]),

  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // The data boundary (CLAUDE.md): only src/data (and src/config, which src/data uses)
      // may talk to Firebase. Components call src/data instead.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["firebase", "firebase/*", "@firebase/*"],
              message:
                "Only src/data and src/config may import Firebase. Call a src/data module instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/data/**", "src/config/**"],
    rules: { "no-restricted-imports": "off" },
  },

  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["scripts/**/*.ts", "vite.config.ts"],
    languageOptions: { globals: globals.node },
  },

  // Plain JS config files aren't in a tsconfig, so skip type-aware rules there.
  {
    files: ["**/*.{js,cjs,mjs}"],
    extends: [js.configs.recommended, tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },

  // Last: turn off every rule that would fight Prettier's formatting.
  prettier,
]);
