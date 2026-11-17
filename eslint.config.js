import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', 'supabase/**', '.vercel/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['apps/web/**/*.ts'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['api/**/*.ts', 'ingest/**/*.ts', 'scripts/**/*.ts', '*.js', '*.ts'],
    languageOptions: { globals: globals.node },
  },
)
