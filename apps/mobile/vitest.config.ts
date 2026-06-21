import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'react-native': path.resolve(__dirname, 'node_modules/react-native-web'),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
    pool: 'forks',
    maxWorkers: 1,
    server: {
      deps: {
        inline: ['@testing-library/react-native', 'react-native-web'],
      },
    },
  },
});
