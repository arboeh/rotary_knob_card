import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/", "coverage/", ".kilocode/"],
  },

  js.configs.recommended,

  {
    files: ["*.config.js"],
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },

  {
    files: ["tests/**/*.test.js", "tests/**/*.js"],
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.vitest,
        ...globals.browser,
      },
    },
  },

  {
    files: ["rotary_knob_card.js"],
    languageOptions: {
      sourceType: "script",
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-useless-escape": "off",
      "no-unused-vars": ["error", { args: "none", varsIgnorePattern: "showLabels" }],
      "no-dupe-else-if": "off",
    },
  },
];
