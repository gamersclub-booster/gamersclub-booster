import js from "@eslint/js";
import globals from "globals";

export default [

  // --- Ignore patterns (replaces .eslintignore)
  {
    ignores: [
      "node_modules/**",
      "**/node_modules/**",
      "**/docs/**",
      "**/coverage/**",
      "coverage/**",
      "dist/**",
      "**/dist/**",
      ".github/**"
    ]
  },

  // --- Base recommended rules (replaces "extends": "eslint:recommended")
  js.configs.recommended,

  // --- Your project rules
  {
    files: ["**/*.js"],

    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",

      globals: {
        // env.es6
        Promise: "readonly",
        Map: "readonly",
        Set: "readonly",

        // env.browser
        window: "readonly",
        document: "readonly",
        navigator: "readonly",

        // env.webextensions
        browser: "readonly",
        chrome: "readonly",

        // env.jquery
        $: "readonly",
        jQuery: "readonly",

        ...globals.browser,
        ...globals.webextensions,
        ...globals.jquery,
        ...globals.es2021
      }
    },

    rules: {
      "array-bracket-spacing": [ "error", "always" ],
      "arrow-parens": [ "error", "as-needed" ],
      "arrow-spacing": [ "error", { before: true, after: true } ],
      "block-spacing": [ "error", "always" ],
      "brace-style": [ "error", "1tbs", { allowSingleLine: true } ],
      "camelcase": [ "error", { properties: "never" } ],
      "comma-dangle": [ "error", "never" ],
      "comma-spacing": [ "error" ],
      "computed-property-spacing": [ "error", "never" ],
      "curly": [ "error" ],
      "eqeqeq": [ "error" ],
      "eol-last": [ "error", "always" ],
      "func-names": "off",
      "generator-star-spacing": [ "error", { before: true, after: false } ],
      "global-require": [ "error" ],

      "indent": [ "error", 2 ],
      "key-spacing": [ "error", { afterColon: true } ],
      "keyword-spacing": [ "error" ],
      "max-len": [ "error", { code: 150 } ],
      "no-bitwise": [ "error", { int32Hint: true } ],
      "no-buffer-constructor": [ "error" ],
      "no-console": "off",
      "no-mixed-operators": [ "error" ],
      "no-multi-spaces": [ "error" ],
      "no-nested-ternary": [ "error" ],
      "no-param-reassign": [ "error" ],
      "no-plusplus": "off",
      "no-regex-spaces": [ "error" ],

      "no-restricted-syntax": [
        "error",
        "Eval",
        "LabeledStatement",
        "WithStatement"
      ],

      "no-return-await": [ "error" ],
      "no-template-curly-in-string": "off",
      "no-trailing-spaces": [ "error" ],
      "no-underscore-dangle": "off",
      "no-unused-expressions": [ "error" ],
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],
      "no-useless-catch": "off",
      "no-useless-constructor": "warn",
      "no-var": [ "error" ],

      "object-curly-newline": [ "error", { consistent: true, multiline: true } ],
      "object-curly-spacing": [ "error", "always" ],
      "operator-linebreak": [ "error", "after" ],
      "prefer-const": "warn",
      "quotes": [ "error", "single" ],
      "require-atomic-updates": "off",
      "semi": [ "error", "always" ],
      "space-before-blocks": [ "error" ],
      "space-before-function-paren": [ "error", { anonymous: "always", named: "never", asyncArrow: "always" } ],
      "space-in-parens": [ "error", "always" ],
      "space-infix-ops": [ "error" ],
      "space-unary-ops": [ "error", { words: true, nonwords: false } ]
    }
  }
];
