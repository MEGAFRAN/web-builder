import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: [
      '__tests__/**/*.{test,spec}.{ts,tsx}',
      'azure-functions/src/__tests__/tenantSettingsStore.test.ts',
      'azure-functions/src/__tests__/createReservation.test.ts',
    ],
    exclude: ['**/node_modules/**'],
    coverage: {
      provider: 'v8',
      enabled: true,
      reporter: ['text', 'text-summary'],
      include: ['**/*.{ts,tsx}'],
      exclude: [
        'azure-functions/**',
        'node_modules/**',
        '.next/**',
        'out/**',
        '**/*.config.{ts,js,mjs}',
        '**/*.setup.{ts,js}',
        '**/types/**',
        '**/*.d.ts',
        '**/*.stories.{ts,tsx}',
        '**/*.story.{ts,tsx}',
        '.storybook/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@azure/functions': resolve(__dirname, 'azure-functions/node_modules/@azure/functions'),
    },
  },
})
