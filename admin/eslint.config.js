import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      // React plugin (flat config) to teach ESLint about JSX variable usage
      react.configs.flat.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Allow capitalized JSX component variables and ignore unused function args that start with _
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      // React 17+ new JSX transform: React import not required
      'react/react-in-jsx-scope': 'off',
      // We don't use PropTypes; disable to avoid noisy errors
      'react/prop-types': 'off',
      // Ensure variables used in JSX are marked as used
      'react/jsx-uses-vars': 'error',
      // Allow quotes/apostrophes in JSX text without escaping
      'react/no-unescaped-entities': 'off',
    },
  },
])
