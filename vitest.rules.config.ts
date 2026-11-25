import { defineConfig } from 'vitest/config'

// Firestore rules tests need the emulator: run them with `pnpm test:rules`.
export default defineConfig({
  test: { include: ['tests/rules/**/*.test.ts'], testTimeout: 15000 },
})
