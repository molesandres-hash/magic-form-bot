/**
 * Vitest Configuration
 *
 * Purpose: Configures Vitest test runner for unit and integration tests
 * Why Vitest: Fast, Vite-native test runner with excellent DX
 *
 * Features:
 * - DOM environment for React component tests
 * - Path aliases matching tsconfig.json
 * - Coverage reporting
 * - Global test utilities
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'jsdom', // For React component testing

    // Global test utilities (no need to import in each test file)
    globals: true,

    // Setup files run before each test file
    setupFiles: ['./src/tests/setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
      ],
      // Coverage thresholds - enforce minimum coverage
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },

    // Test file patterns
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],

    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
    ],

    // Mock CSS modules
    css: false,
  },

  // Path aliases (must match tsconfig.json)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
