import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts', 'eval/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/**/index.ts'],
      // Phase 48.4.1 (audit 2026-04-30): added 'json-summary' so CI and
      // future automation can parse coverage without scraping text output.
      reporter: ['text', 'lcov', 'json-summary'],
      // Phase 48.4.1 (audit 2026-04-30, Verification Gate G7): floor raised
      // from 70/60/70/70 to lock in the Node 20 baseline. The Node 20
      // green-bar measured (1163 tests, vitest 4.1.5):
      //   statements 89.94 / branches 79.25 / functions 92.38 / lines 90.95
      // Floor sits ~5pp below actual to absorb normal churn while still
      // catching a real regression. Raise the floor again as coverage
      // climbs; never lower it without an explicit audit amendment.
      thresholds: {
        statements: 85,
        branches: 72,
        functions: 85,
        lines: 85,
      },
    },
  },
})
