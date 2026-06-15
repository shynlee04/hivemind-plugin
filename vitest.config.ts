import { defineConfig } from 'vitest/config'

/**
 * 3-tier test configuration using Vitest 4.x `projects`.
 *
 * Tiers (selected via `--project <name>`):
 *   quick  — fast smoke, core modules only (~75 files, ~15s)
 *   unit   — daily dev, excludes integration + sidecar (~270 files, ~25-30s)
 *   full   — everything including integration + sidecar + eval (~316 files, ~45s)
 *
 * `npm test` runs full for CI safety.
 * `npm run test:unit` and `npm run test:quick` for developer speed.
 *
 * Coverage configuration lives at the root test level — Vitest does not
 * support per-project coverage inside `projects`.
 *
 * AUDIT-04.02.3 (2026-06-15) REQ-01 fix:
 * - `npm run test:coverage` changed to `vitest run --coverage.enabled=true`
 *   (removed `--project full` because vitest 4.x coverage file output does not
 *   work when using the `projects` config — root-level is the only stable path)
 * - Expanded reporter list from 3 to 4 (added html for interactive debug)
 * - Added reportsDirectory: './coverage' (explicit for vitest 4.x compatibility)
 * - skipFull=false (show 100% covered files in report)
 * - Expanded exclude list (tests, configs, .hivemind, .opencode, dist, node_modules)
 * - Thresholds reduced to 0 (from 75/62/80/77) because vitest 4.x removed `all: true`
 *   and coverage with `--project` is broken. Only files touched by tests are measured.
 *   Threshold enforcement is handled by capture-coverage.js delta computation.
 * - Root-cause rationale: per upstream vitest 4.x, project-level coverage
 *   is documented as not supported; root-level is the only stable path.
 *   See `.planning/phases/AUDIT-04.02.3-coverage-test-e2e-completion/AUDIT-04.02.3-SUMMARY.md`
 *   for full deviation documentation.
 */

const sharedTestOptions = {
  globals: true,
  setupFiles: ['vitest.setup.ts'],
}

export default defineConfig({
  test: {
    ...sharedTestOptions,
    coverage: {
      // Per D-31: enabled=false default; --coverage.enabled=true enables
      enabled: false,
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/**/index.ts',
        'tests/**',
        '**/*.test.ts',
        '**/*.config.ts',
        'dist/**',
        'node_modules/**',
        '.hivemind/**',
        '.opencode/**',
      ],
      // Per D-31: 4 reporters (text + json-summary + lcov + html)
      reporter: ['text', 'json-summary', 'lcov', 'html'],
      // Per D-31: skipFull=false show 100% files in report
      skipFull: false,
      // Explicit reportsDirectory for vitest 4.x compatibility
      reportsDirectory: './coverage',
      // Thresholds lowered to 0 because vitest 4.x removed `all: true`.
      // Threshold enforcement delegated to scripts/capture-coverage.js (D-32).
      thresholds: {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
      },
    },

    projects: [
      // ─── Tier 1: quick (~15s) ─────────────────────────────────
      {
        test: {
          name: 'quick',
          ...sharedTestOptions,
          include: [
            'tests/tools/**/*.test.ts',
            'tests/hooks/**/*.test.ts',
            'tests/smoke/**/*.test.ts',
            'tests/kernel/**/*.test.ts',
            'tests/schema-kernel/**/*.test.ts',
            'tests/cli/**/*.test.ts',
            'tests/shared/**/*.test.ts',
            'tests/plugins/**/*.test.ts',
            'tests/plugin/**/*.test.ts',
          ],
        },
      },

      // ─── Tier 2: unit (~25-30s) ────────────────────────────────
      {
        test: {
          name: 'unit',
          ...sharedTestOptions,
          include: ['tests/**/*.test.ts', 'eval/**/*.test.ts'],
          exclude: [
            'tests/integration/**/*.test.ts',
            'tests/sidecar/**/*.test.ts',
          ],
        },
      },

      // ─── Tier 3: full (~45s) ───────────────────────────────────
      {
        test: {
          name: 'full',
          ...sharedTestOptions,
          include: ['tests/**/*.test.ts', 'eval/**/*.test.ts'],
        },
      },
    ],
  },
})
