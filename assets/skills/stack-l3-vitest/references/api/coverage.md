# Coverage Configuration

> Vitest supports V8 and Istanbul coverage providers.

## Provider Comparison

| Feature | V8 | Istanbul |
|---------|-----|----------|
| Speed | Fast (native) | Slower (instrumented) |
| Accuracy | AST-based (4.0+) | Line-level |
| Source maps | Yes | Yes |
| Edge cases | Better in 4.0 | Battle-tested |
| Recommendation | Default choice | For legacy compatibility |

## Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      // Provider: 'v8' (default) or 'istanbul'
      provider: 'v8',

      // Output formats
      reporter: ['text', 'json', 'html', 'lcov'],

      // File patterns
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/index.ts',           // Re-export only
        'src/types.ts',           // Type definitions
      ],

      // All files (include untested)
      all: true,

      // Thresholds — enforce minimum coverage
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,

        // Per-file thresholds
        perFile: true,

        // Fail if below threshold
        // (vitest exits with non-zero code)
        100: false,    // Set true for 100% requirement
      },

      // Custom reports directory
      reportsDirectory: './coverage',

      // Exclude files from coverage after collection
      coverageExcludes: [],

      // Watermarks for reporter coloring
      watermarks: {
        statements: [80, 95],
        functions: [80, 95],
        branches: [80, 95],
        lines: [80, 95],
      },
    },
  },
})
```

## CLI Usage

```bash
# Run with coverage
npx vitest run --coverage

# Specify provider
npx vitest run --coverage.provider=v8

# Change reporter
npx vitest run --coverage.reporter=json

# Custom output directory
npx vitest run --coverage.reportsDirectory=./reports

# Include all files (even untested)
npx vitest run --coverage.all

# Enable per-file thresholds
npx vitest run --coverage.thresholds.perFile
```

## Viewing Coverage

```bash
# Generate HTML report
npx vitest run --coverage --coverage.reporter=html
open coverage/index.html

# Terminal summary
npx vitest run --coverage --coverage.reporter=text

# LCOV (CI integration)
npx vitest run --coverage --coverage.reporter=lcov
# Upload to Codecov, Coveralls, etc.
```

## This Project's Coverage Setup

```typescript
// From package.json scripts:
// "test:coverage": "vitest run --coverage"

// Covers: src/**/*.ts
// Excludes: src/index.ts (re-exports only)
// Provider: v8 (fast, native)
// Target: ~80% across all dimensions
```

## Vitest 4.0 Coverage Improvements

- **AST-based remapping:** Replaced v8-to-istanbul with AST-based approach
- **Higher accuracy:** Eliminates false positives from v8-to-istanbul
- **Performance:** Faster than Istanbul while maintaining accuracy
- **Source map support:** Better handling of TypeScript/JSX transforms

---

*Source: Vitest 4.x docs, Context7 `/vitest-dev/vitest`*
