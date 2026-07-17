/** ESLint configuration for the TikTok Multi Uploader desktop app. */
module.exports = {
  root: true,
  env: { browser: true, es2024: true, node: true },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react-hooks/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  settings: {
    react: { version: 'detect' },
  },
  ignorePatterns: ['dist', 'dist-electron', 'release', 'node_modules', '*.cjs'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    'react-refresh/only-export-components': 'off',
    'no-console': 'off',
  },
};
