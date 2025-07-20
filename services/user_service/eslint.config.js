import tseslint from 'typescript-eslint'
import prettierPlugin from 'eslint-plugin-prettier'
import parser from '@typescript-eslint/parser'
import { fileURLToPath } from 'url'
import path from 'path'
import { EndOfLineState } from 'typescript'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default tseslint.config([
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['dist', 'node_modules'],
    languageOptions: {
      parser,
      sourceType: 'module',
      ecmaVersion: 2020,
      parserOptions: {
        project: path.join(__dirname, 'tsconfig.json'),
        tsconfigRootDir: __dirname
      }
    },
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      'linebreak-style': 'off',
      'no-var': 'error',
      'prefer-const': 'error', 
      // Prettier integration
      'prettier/prettier': ['error', { tabWidth: 4, semi: true, endOfLine: 'auto' }],

      // Recommended rules from typescript-eslint
      ...tseslint.configs.recommended.rules
    }
  }
])
