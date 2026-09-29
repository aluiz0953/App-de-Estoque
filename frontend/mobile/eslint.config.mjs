// Quality gates: file-size budget and no direct console, plus the ESLint
// recommended set. Rule sources live in ./eslint-rules (copied from the
// vibe-coding-toolkit templates). React Native / plain JS: the old
// @react-native-community/eslint-config only supports ESLint 8 and was dropped.
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
      globals: { ...globals.node, __DEV__: "readonly", fetch: "readonly", FormData: "readonly", AbortController: "readonly" },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}", "App.js", "index.js"],
    plugins: { quality, react, "react-hooks": reactHooks },
    settings: { react: { version: "detect" } },
    rules: {
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Known offenders inherited from master; split them, then delete the entry.
      "quality/max-lines": [
        "error",
        {
          max: 350,
          ignore: [
            "src/screens/AddEditPedidoScreen.js",
            "src/screens/AddEditProductScreen.js",
            "src/screens/HistoryScreen.js",
            "src/screens/SettingsScreen.js",
          ],
        },
      ],
      // Baseline 3 -> "error" at 0.
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "quality/no-direct-console": ["error", { logger: "a logger module" }],
    },
  },
  {
    files: ["**/*.test.{js,jsx}", "**/__tests__/**/*.{js,jsx}"],
    languageOptions: { globals: { ...globals.jest } },
    plugins: { quality },
    rules: { "quality/max-lines": ["warn", { max: 350, includeTests: true }] },
  },
  globalIgnores(["android/**", "ios/**", "node_modules/**", "graphify-out/**", "coverage/**", "verify.mjs", "*.log"]),
]);
