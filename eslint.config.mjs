import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";
import prettier from "eslint-config-prettier/flat";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/dist-openapi/**",
      "**/coverage/**",
      "**/src/generated/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs["flat/recommended"],
  {
    files: ["apps/web/**/*.{ts,vue}"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["apps/api/**/*.ts", "packages/**/*.ts", "**/*.config.*"],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
