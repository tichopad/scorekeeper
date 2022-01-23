/** @type {import("eslint/lib/shared/types").ConfigData} */
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'plugin:react/recommended',
    'standard'
  ],
  ignorePatterns: ['dist', 'node_modules'],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      extends: ['standard', 'plugin:@typescript-eslint/recommended-requiring-type-checking'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        },
        ecmaVersion: 'latest',
        project: ['./tsconfig.json'],
        sourceType: 'module',
        tsconfigRootDir: __dirname
      },
      plugins: [
        'react',
        '@typescript-eslint'
      ],
      rules: {
        '@typescript-eslint/array-type': ['error', { default: 'generic' }],
        '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
        '@typescript-eslint/indent': ['error', 2],
        '@typescript-eslint/require-await': ['off'],
        indent: 'off', // Has issues with TS code
        'no-unused-vars': 'off', // Has issues with declarations
        'react/react-in-jsx-scope': 'off'
      }
    }
  ],
  rules: {
    'import/order': [
      'warn',
      {
        alphabetize: { order: 'asc' },
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type']
      }
    ]
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
}
