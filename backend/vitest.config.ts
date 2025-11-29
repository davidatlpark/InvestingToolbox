import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use Node.js environment for backend tests
    environment: 'node',

    // Include test files
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
    },

    // Global test timeout
    testTimeout: 10000,

    // Reporter
    reporter: ['verbose'],
  },

  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
