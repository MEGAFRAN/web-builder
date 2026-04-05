import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      enabled: true,
      reporter: ['text', 'text-summary'],
      include: ['**/*.{ts,tsx}'],
      exclude: [
        'node_modules/**',
        '.next/**',
        'out/**',
        '**/*.config.{ts,js,mjs}',
        '**/*.setup.{ts,js}',
        '**/types/**',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})
