/**
 * JSDoc Configuration for Medical Scribe AI
 * Generates comprehensive API documentation from TypeScript source code
 */

module.exports = {
  source: {
    include: ['./src/'],
    includePattern: '\\.(js|jsx|ts|tsx)$',
    exclude: [
      './src/**/*.test.ts',
      './src/**/*.test.tsx',
      './src/**/*.spec.ts',
      './src/**/*.spec.tsx',
      './node_modules/'
    ]
  },
  opts: {
    destination: './docs/api/',
    recurse: true,
    readme: './README.md'
  },
  plugins: [
    'plugins/markdown',
    'plugins/typescript'
  ],
  templates: {
    cleverLinks: false,
    monospaceLinks: false
  },
  typescript: {
    moduleRoot: './src'
  },
  metadata: {
    title: 'Medical Scribe AI - API Documentation',
    version: '1.0.0',
    description: 'Comprehensive API documentation for the Medical Scribe AI application'
  }
};