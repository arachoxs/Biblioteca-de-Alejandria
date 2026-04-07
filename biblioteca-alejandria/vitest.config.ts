import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./__tests__/setup.ts'],
    include: ['__tests__/**/*.test.ts'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: [
        'models/**/*.ts',
        'services/**/*.ts',
        'app/**/actions.ts',
        'app/**/action.ts',
        'lib/validations/**/*.ts'
      ],
      exclude: [
        'node_modules',
        '__tests__',
        '**/*.d.ts',
        '**/*.test.ts'
      ],
      thresholds: {
        statements: 60,
        branches: 55,
        functions: 70,
        lines: 60
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
});
