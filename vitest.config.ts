import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/memory/__tests__/**/*.test.ts', 'src/memory/__tests__/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'lcov'],
    include: ['src/memory/**'],
    exclude: ['src/memory/__tests__/**', 'node_modules', '*.config.*'],
    thresholds: {
      lines: 90,
      functions: 90,
      branches: 80,
      statements: 90,
    },
  },
})