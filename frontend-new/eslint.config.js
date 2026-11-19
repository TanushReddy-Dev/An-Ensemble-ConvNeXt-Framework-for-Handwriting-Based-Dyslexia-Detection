import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist/**", "public/**", ".prerender/**", "shots/**"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
];
