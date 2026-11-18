import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', 'supabase/**', '.vercel/**', 'playwright-report/**', 'test-results/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['apps/web/**/*.ts'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['apps/web/public/sw.js'],
    languageOptions: { globals: globals.serviceworker },
  },
  {
    files: ['api/**/*.ts', 'e2e/**/*.ts', 'ingest/**/*.ts', 'packages/**/*.ts', 'scripts/**/*.ts', '*.js', '*.ts'],
    languageOptions: { globals: globals.node },
  },
)
