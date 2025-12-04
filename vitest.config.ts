import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['packages/**/*.spec.ts', 'app/**/*.spec.ts'],
    environment: 'node',
    reporters: ['basic'],
  }
});
