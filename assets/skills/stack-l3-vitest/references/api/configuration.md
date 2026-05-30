# Configuration — `vitest.config.ts`

> Vitest configuration via `defineConfig` from `vitest/config`.

## Basic Config

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Test file patterns
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/cypress/**', '**/.{idea,git,tmp,output}/**'],

    // Environment: 'node' (default) | 'jsdom' | 'happy-dom'
    environment: 'node',

    // Global API — no imports needed for describe, it, expect, vi
    globals: true,

    // Setup files — run before each test suite
    setupFiles: ['./tests/setup.ts'],

    // Global setup — run once before/after all test files
    globalSetup: ['./tests/globalSetup.ts'],

    // Timeouts (ms)
    testTimeout: 5000,
    hookTimeout: 10000,
    teardownTimeout: 10000,

    // Mock behavior
    clearMocks: false,       // Auto-clear mock.calls before each test
    restoreMocks: false,     // Auto-restore spy implementations
    mockReset: false,        // Auto-reset mock implementations
    unstubGlobals: false,    // Auto-restore stubbed globals
    unstubEnvs: false,       // Auto-restore stubbed env vars
  },
})
```

## Worker Pool

```typescript
test: {
  // Pool type: 'threads' (default) | 'forks' | 'vmThreads' | 'vmForks'
  pool: 'threads',

  poolOptions: {
    threads: {
      singleThread: false,        // Run in single thread
      maxThreads: 4,              // Max worker threads
      minThreads: 1,              // Min worker threads
      isolate: true,              // Isolate each test file
      useAtomics: false,          // Atomic operations for concurrency
    },
    forks: {
      singleFork: false,
      maxForks: 4,
      minForks: 1,
      isolate: true,
    },
  },

  // Maximum concurrent tests
  maxConcurrency: 5,
}
```

## Reporters

```typescript
test: {
  // Single reporter
  reporters: 'default',

  // Multiple reporters
  reporters: ['default', 'html'],

  // Reporter with options
  reporters: [
    ['default', { summary: true }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'junit.xml' }],
  ],

  // Custom reporter
  reporters: ['./tests/my-reporter.ts'],
}
```

## Environment Options

```typescript
test: {
  environment: 'jsdom',
  environmentOptions: {
    jsdom: {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable',
    },
    happy_dom: {
      url: 'http://localhost:3000',
      settings: { disableJavaScriptEvaluation: true },
    },
  },
}
```

## Workspace / Multi-Project

```typescript
// vitest.workspace.ts
export default defineWorkspace([
  'packages/*',
  {
    test: {
      name: 'unit',
      include: ['tests/unit/**/*.test.ts'],
      environment: 'node',
    },
  },
  {
    test: {
      name: 'integration',
      include: ['tests/integration/**/*.test.ts'],
      environment: 'node',
      testTimeout: 30000,
    },
  },
])
```

## Project-Level Config (4.x)

```typescript
test: {
  projects: [
    {
      name: 'Production env',
      execArgv: ['--env-file=.env.prod'],
    },
    {
      name: 'Staging env',
      execArgv: ['--env-file=.env.staging'],
    },
  ],
}
```

## Snapshot Configuration

```typescript
test: {
  snapshotFormat: {
    escapeString: true,
    printBasicPrototype: true,
    indent: 2,
    callToJSON: true,
  },
  resolveSnapshotPath: (testPath, snapExtension) => {
    return testPath.replace(/\.test\.ts$/, snapExtension)
  },
}
```

## Type Checking

```typescript
test: {
  typecheck: {
    enabled: true,
    checker: 'tsc',           // 'tsc' | 'vue-tsc'
    tsconfig: './tsconfig.json',
    include: ['src/**/*.ts'],
  },
}
```

## CLI Flags

```bash
vitest                          # Watch mode
vitest run                      # Single run
vitest run --coverage           # With coverage
vitest run -t "pattern"         # Filter tests by name
vitest run --reporter=verbose   # Verbose output
vitest run --reporter=json      # JSON output
vitest run --project unit       # Run specific workspace project
vitest bench                    # Run benchmarks
vitest --ui                     # Browser UI
vitest --inspect                # Debug with Node inspector
vitest --update                 # Update snapshots
```

---

*Source: Vitest 4.x docs, Context7 `/vitest-dev/vitest`, Tavily search*
