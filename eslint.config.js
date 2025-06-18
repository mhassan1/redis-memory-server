/* eslint @typescript-eslint/no-require-imports: 0 */

const { defineConfig, globalIgnores } = require('eslint/config');

const tsParser = require('@typescript-eslint/parser');
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const prettier = require('eslint-plugin-prettier');
const globals = require('globals');
const js = require('@eslint/js');

const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = defineConfig([
  {
    languageOptions: {
      parser: tsParser,
      sourceType: 'module',

      parserOptions: {
        useJSXTextNode: true,
      },

      globals: {
        ...globals.jest,
      },
    },

    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier,
    },

    extends: compat.extends('plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'),

    rules: {
      'no-underscore-dangle': 0,
      'arrow-body-style': 0,
      'no-unused-expressions': 0,
      'no-plusplus': 0,
      'no-console': 0,
      'func-names': 0,

      'comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
          functions: 'ignore',
        },
      ],

      'no-prototype-builtins': 0,
      'prefer-destructuring': 0,
      'no-else-return': 0,

      'lines-between-class-members': [
        'error',
        'always',
        {
          exceptAfterSingleLine: true,
        },
      ],

      '@typescript-eslint/explicit-member-accessibility': 0,
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-inferrable-types': 0,
      '@typescript-eslint/explicit-function-return-type': 0,
      '@typescript-eslint/no-use-before-define': 0,
      '@typescript-eslint/no-empty-function': 0,
      curly: ['error', 'all'],
    },
  },
  globalIgnores(['flow-typed/*', 'lib/*', '.yarn/*']),
]);
