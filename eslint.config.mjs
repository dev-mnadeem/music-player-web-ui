import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

/**
 * Flat config. `next/core-web-vitals` carries the React and accessibility
 * rules, `next/typescript` the TypeScript ones.
 */
const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'coverage/**']
  },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // Unused arguments are fine when prefixed, which route handlers need for
      // the `_request` parameter they must accept but never read.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error'
    }
  }
];

export default config;
