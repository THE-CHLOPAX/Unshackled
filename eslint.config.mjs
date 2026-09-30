import js from '@eslint/js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'eslint/config';
import { FlatCompat } from '@eslint/eslintrc';
import tsParser from '@typescript-eslint/parser';
import perfectionist from 'eslint-plugin-perfectionist';
import typescriptEslint from '@typescript-eslint/eslint-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'scripts/**',
      'dist/**',
      'build/**',
      'release/**',
      '*.min.js',
      'src/renderer/FMOD/fmodstudio.wasm',
      'src/renderer/FMOD/fmodstudio.js',
      'webpack.*.js',
    ],
  },
  ...compat.extends('prettier'),
  {
    extends: compat.extends(
      'eslint:recommended',
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended'
    ),

    plugins: {
      '@typescript-eslint': typescriptEslint,
      perfectionist,
    },

    languageOptions: {
      parser: tsParser,
    },

    rules: {
      'max-len': [
        'error',
        {
          code: 100,
          tabWidth: 2,
          ignoreComments: true,
          ignoreStrings: true,
        },
      ],
      quotes: [
        'error',
        'single',
        {
          avoidEscape: true,
        },
      ],
      semi: [2, 'always'],
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-non-null-assertion': 'error',

      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'memberLike',
          modifiers: ['private'],
          format: ['camelCase'],
          leadingUnderscore: 'require',
        },
      ],
      'no-console': ['error'],
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'line-length',
          order: 'asc',

          groups: [
            ['type', 'builtin-type', 'internal-type', 'parent-type', 'sibling-type'],
            ['builtin', 'external'],
            'internal',
            ['parent', 'sibling', 'index'],
            'object',
            'unknown',
          ],

          internalPattern: ['^renderer/.+', '^3D/.+', '^UI', '^Views', '^Store/.+', '^WorldEditor/.+'],
        },
      ],
    },
  },
  {
    files: [
      'src/lib/internal-ui/utils/logger.ts',
      'src/lib/internal-3d/ResourceTracker/ResourceTracker.ts',
      'src/lib/ipc.web.ts',
      'src/main/**/*',
    ],
    rules: {
      'no-console': 'off',
    },
  },
]);
