import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // No escape hatches — explicit types make intent clear and prevent silent regressions.
      '@typescript-eslint/no-explicit-any': 'error',

      // Ban unsafe operations that bypass the type system.
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',

      // Unused code is dead weight; catch it at lint time, not code review.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // All hooks deps must be listed; missing ones cause subtle stale-closure bugs.
      'react-hooks/exhaustive-deps': 'warn',

      // Components are large enough to need this; pages stay under 200.
      'max-lines': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],

      // Deeply nested logic is a sign the function should be split.
      complexity: ['warn', 10],

      // Prefer non-null assertions and optional chaining over runtime crashes.
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Consistent import style — type-only imports must use `import type`.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },
])
