// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { includeIgnoreFile } from '@eslint/compat';
import eslint from '@eslint/js';
import headerPlugin from 'eslint-plugin-header';
import eslintPrettier from 'eslint-plugin-prettier/recommended';
import unicornPlugin from 'eslint-plugin-unicorn';
import globals from 'globals';
import path from 'node:path';
import tsEslint from 'typescript-eslint';

// https://github.com/Stuk/eslint-plugin-header/issues/57
headerPlugin.rules.header.meta.schema = false;

export default tsEslint.config(
  includeIgnoreFile(path.resolve('.gitignore')),
  eslint.configs.recommended,
  tsEslint.configs.recommended,
  eslintPrettier,
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    plugins: { unicorn: unicornPlugin, header: headerPlugin },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'header/header': [
        'error',
        'line',
        [' Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.', ' SPDX-License-Identifier: Apache-2.0'],
      ],
    },
  },
  {
    files: ['.github/**', 'scripts/**', '*.mjs', 'test/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.commonjs,
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  {
    files: ['src/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
  {
    files: ['src/**/__tests__/**/*.*js'],
    rules: {
      'no-undef': 'warn',
    },
  },
);
