// Static analysis for the backend: ESLint core rules + eslint-plugin-security.
// (The React app is analysed by CodeQL - see .github/workflows/codeql.yml.)
import js from '@eslint/js';
import globals from 'globals';
import security from 'eslint-plugin-security';

export default [
  { ignores: ['node_modules/**', 'client/**', 'reports/**', 'logs/**', 'src/data/**', 'coverage/**'] },
  // Suppression comments are each justified inline; don't fail the build over their bookkeeping.
  { linterOptions: { reportUnusedDisableDirectives: 'off' } },
  js.configs.recommended,
  security.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'commonjs', globals: { ...globals.node } },
    rules: {
      'no-unused-vars': ['error', { caughtErrors: 'all', ignoreRestSiblings: true }],
      eqeqeq: ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
  {
    // Test code builds temp-file paths on purpose and indexes fixtures by literal position.
    files: ['tests/**/*.js'],
    rules: { 'security/detect-non-literal-fs-filename': 'off' },
  },
  { files: ['eslint.config.mjs'], languageOptions: { sourceType: 'module' } },
];
