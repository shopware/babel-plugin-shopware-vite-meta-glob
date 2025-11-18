import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.ts', 'src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/fixtures/**', '**/__snapshots__/**'],
  },
})
