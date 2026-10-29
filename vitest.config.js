import { defineConfig } from 'vitest/config'

// Keep unit tests independent of the PWA/Vite app plugins.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
})
