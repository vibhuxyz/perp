import reactRefresh from 'eslint-plugin-react-refresh'
import tailwindcss from 'eslint-plugin-tailwindcss'
import { config as reactInternalConfig } from '@repo/eslint-config/react-internal'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      ...reactInternalConfig,
      reactRefresh.configs.vite,
    ],
    plugins: {
      tailwindcss,
    },
    settings: {
      tailwindcss: {
        // Tailwind v4 is CSS-first (no tailwind.config.js) — point the plugin at the theme file.
        cssConfigPath: './src/index.css',
      },
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

      // Prefer non-null assertions and optional chaining over runtime crashes.
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Consistent import style — type-only imports must use `import type`.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Same check the Tailwind CSS IntelliSense extension shows inline — the shortest
      // canonical class name for a given style (e.g. text-[#8492A6] -> text-text-secondary).
      'tailwindcss/enforces-canonical-classname': 'warn',
    },
  },
])
