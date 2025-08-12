module.exports = {
  extends: [
    'next/core-web-vitals',
    'prettier'
  ],
  plugins: ['prettier'],
  rules: {
    // Prettier integration
    'prettier/prettier': 'error',
    
    // React/Next.js specific rules
    'react/jsx-curly-brace-presence': ['error', 'never'],
    'react/self-closing-comp': 'error',
    'react/jsx-boolean-value': ['error', 'never'],
    'react-hooks/exhaustive-deps': 'warn',
    
    // General code quality rules  
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'no-unused-expressions': 'error',
    'prefer-template': 'error',
    'object-shorthand': 'error',
  },
  ignorePatterns: [
    'node_modules/**',
    '.next/**', 
    'out/**',
    'build/**',
    'dist/**',
    '*.min.js',
    'coverage/**',
    '.env*',
    'public/**'
  ]
}