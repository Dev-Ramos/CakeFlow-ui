import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * Fronteiras de arquitetura (ver SPEC-DECISOES.md):
 *   app -> domains -> ui ; domains -> services
 *   ui e services não importam camadas acima.
 */
const layer = (name, forbidden, message) => ({
  files: [`src/${name}/**/*.{ts,tsx}`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        // Cada item é um padrão, ou uma lista (padrão + exceções com "!").
        patterns: forbidden.map((group) => ({
          group: Array.isArray(group) ? group : [group],
          message,
        })),
      },
    ],
  },
})

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
  },
  layer(
    'ui',
    ['@/app/**', '@/domains/**', '@/services/**'],
    'ui/ não conhece app, domínios nem services.',
  ),
  layer(
    'services',
    ['@/app/**', '@/domains/**', '@/ui/**'],
    'services/ não importa app, domínios nem ui.',
  ),
  layer(
    'domains',
    [
      '@/app/**',
      // Exceção: o gate de permissão é infraestrutura de autenticação usada nas rotas dos domínios.
      ['@/domains/*/components/**', '!@/domains/auth/components/RequirePermission'],
      '@/domains/*/pages/**',
    ],
    'Domínios não importam app; entre domínios, só api/hooks/types (imports do próprio domínio são relativos).',
  ),
])
