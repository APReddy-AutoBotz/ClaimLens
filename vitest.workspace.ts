import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // Node.js project - backend, API, core logic
  {
    test: {
      name: 'node',
      include: [
        'packages/**/*.spec.ts',
        'app/api/**/*.spec.ts',
        '!**/*.browser.spec.ts',
        '!**/*.e2e.spec.ts',
      ],
      exclude: [
        'e2e/**',
        '**/*.e2e.spec.ts',
        'node_modules/**',
        'dist/**',
      ],
      environment: 'node',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov', 'html'],
        thresholds: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
        exclude: [
          '**/*.spec.ts',
          '**/*.e2e.spec.ts',
          '**/*.browser.spec.ts',
          '**/types.ts',
          'dist/**',
          'node_modules/**',
        ],
      },
    },
  },
  // Browser project - extension, DOM-dependent code
  {
    test: {
      name: 'browser',
      include: [
        'app/web/**/*.browser.spec.ts',
        'packages/**/*.browser.spec.ts',
      ],
      exclude: [
        'e2e/**',
        '**/*.e2e.spec.ts',
        'node_modules/**',
        'dist/**',
      ],
      environment: 'jsdom',
      environmentOptions: {
        jsdom: {
          url: 'http://localhost/',
        },
      },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov', 'html'],
        thresholds: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
        exclude: [
          '**/*.spec.ts',
          '**/*.e2e.spec.ts',
          '**/*.browser.spec.ts',
          'dist/**',
          'node_modules/**',
        ],
      },
    },
  },
]);
