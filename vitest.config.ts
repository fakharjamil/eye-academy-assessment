import { defineConfig } from 'vitest/config'

// Kept apart from vite.config.ts so unit tests don't start the Cloudflare and TanStack plugins.
export default defineConfig({
  test: { include: ['src/**/*.test.ts', 'tests/**/*.test.ts'] },
})
