// Quality gates: file-size budget and no direct console, plus the ESLint
// recommended set. Rule sources live in ./eslint-rules (copied from the
// vibe-coding-toolkit templates). Plain JS/JSX project: no TypeScript preset,
// no data-access boundary (the web app only talks to the API over HTTP).
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

import quality from "./eslint-rules/index.cjs";

export default defineConfig([
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    plugins: { quality, react, "react-hooks": reactHooks },
    settings: { react: { version: "detect" } },
    rules: {
      // Marks JSX-used identifiers as used so no-unused-vars stays accurate.
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Known offenders inherited from master; split them, then delete the entry.
      "quality/max-lines": ["error", { max: 350, ignore: ["src/pages/ReportsPage.jsx"] }],
      // Baseline 14 (mostly unused reducer args and catch bindings) -> "error" at 0.
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Baseline 2 (NotificationsPage) -> "error" once a logger exists and the count is 0.
      "quality/no-direct-console": ["warn", { logger: "a logger module" }],
    },
  },
  {
    files: ["**/*.test.{js,jsx}"],
    plugins: { quality },
    rules: { "quality/max-lines": ["warn", { max: 350, includeTests: true }] },
  },
  {
    files: ["eslint-rules/**/*.cjs", "verify.mjs", "vite.config.js", "postcss.config.js", "tailwind.config.js"],
    languageOptions: { globals: { ...globals.node } },
  },
  globalIgnores(["dist/**", "node_modules/**", "graphify-out/**", "coverage/**", "verify.mjs"]),
]);
