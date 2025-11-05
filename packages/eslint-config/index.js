import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export const base = tseslint.config([
  {
    ignores: ["dist/**", "node_modules/**", "*.d.ts"],
  },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
]);

export const node = tseslint.config([
  ...base,
  {
    files: ["**/*.{ts,js}"],
    languageOptions: {
      globals: globals.node,
    },
  },
]);

export const react = async () => {
  const reactHooks = await import("eslint-plugin-react-hooks");
  const reactRefresh = await import("eslint-plugin-react-refresh");

  return tseslint.config([
    ...base,
    {
      files: ["**/*.{ts,tsx}"],
      plugins: {
        "react-hooks": reactHooks.default,
        "react-refresh": reactRefresh.default,
      },
      languageOptions: {
        globals: globals.browser,
      },
      rules: {
        ...reactHooks.default.configs.recommended.rules,
        "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      },
    },
  ]);
};
