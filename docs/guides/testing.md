<!-- generated-by: gsd-doc-writer -->

# Testing

## Test Framework and Setup

The harness uses [Vitest](https://vitest.dev) (`^4.1.7`) with `@vitest/coverage-v8` for coverage reporting. Globals are enabled in `vitest.config.ts`, so `describe`, `it`, `expect`, `beforeEach`, `afterEach`, and `vi` are available without explicit imports in most test files. Some files import them explicitly from `"vitest"` for clarity.

**Framework:** Vitest 4.x, `@vitest/coverage-v8` v4.x.  
**Test location:** `tests/` directory mirrors `src/` structure.  
**Additional test roots:** `eval/` contains stability, coherence, and correctness evaluation tests (`eval/*.test.ts`) that are included in the test suite.  
**Prerequisites:** `npm install` — no environment variables are required to run tests. When `NODE_ENV=test`, the SDK session ID sanitizer relaxes its prefix-stripping rules to allow `child-` and `parent-` prefixed session IDs for test isolation.

### Vitest configuration (`vitest.config.ts`)

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts', 'eval/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/**/index.ts'],
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        statements: 75,
        branches: 62,
        functions: 80,
        lines: 77,
      },
    },
  },
})
```

## Running Tests

| Command | What it runs |
|---------|-------------|
| `npm test` | Entire test suite — all `tests/**/*.test.ts` and `eval/**/*.test.ts` files |
| `npm run test:watch` | Watch mode — re-runs affected tests on file changes |
| `npm run test:coverage` | Full suite with coverage report (text, lcov, json-summary) |
| `npx vitest run tests/lib/helpers.test.ts` | Single test file |
| `npx vitest run -t "isObject returns false for null"` | Single test by name pattern |
| `npx vitest run tests/lib/spawner/` | All tests in a subdirectory |

```bash
# Full suite (242 test files + 3 eval files as of 2026-05-30)
npm test

# Single file
npx vitest run tests/lib/helpers.test.ts

# By test name pattern
npx vitest run -t "DelegationConcurrencyQueue"

# Watch mode for iterative development
npm run test:watch

# Coverage
npm run test:coverage
```

All 2,963 tests are expected to pass on commit (verified 2026-05-30).

## Test Structure

```
tests/
├── cli/                          # CLI substrate tests
├── coordination/                 # Coordination module tests (completion detection)
├── features/                     # Feature module tests
│   ├── agent-work-contracts/
│   ├── governance-engine/
│   ├── runtime-pressure/
│   └── session-tracker/
├── hooks/                        # Hook factory tests (19 files: core, session, tool-guard,
│   │                             #   CQRS boundary, types, observers, transforms)
│   ├── observers/
│   └── transforms/
├── integration/                  # Cross-module integration tests (13 files)
├── kernel/                       # Kernel-level tests
├── lib/                          # Core library tests — mirrors src/ (56 files)
│   ├── agent-work-contracts/     #   Work contract store
│   ├── behavioral-profile/       #   Profile resolution tests
│   ├── command-engine/           #   Command engine tests
│   ├── config-workflow/          #   Workflow state, regression, guards, persistence, E2E
│   ├── control-plane/            #   Gatekeeper tests
│   ├── coordination/             #   Concurrency queue, slot manager
│   ├── delegation/               #   Delegation state machine
│   ├── doc-intelligence/         #   Router, chunker, parser
│   ├── features/                 #   Feature-specific tests
│   ├── helpers/                  #   Helper utility tests
│   ├── prompt-packet/            #   Delegation packet, kernel packet, compaction
│   ├── pty/                      #   PTY manager, buffer, runtime tests
│   ├── recovery/                 #   State assessment, repair, checkpoint
│   ├── runtime-detection/        #   Code scanning, file watcher, stack synthesizer
│   ├── runtime-pressure/         #   Model, authority matrix, conformance
│   ├── sdk-supervisor/           #   SDK wrapper health tests
│   ├── security/                 #   Redaction, path scope
│   ├── session-entry/            #   Intake gate, profile, purpose, language
│   ├── session-tracker/          #   Event capture, handlers, bug fixes
│   │   └── handlers/             #     Event handlers (created, deleted, error, etc.)
│   ├── spawner/                  #   Session creator, agent policy, concurrency key
│   ├── trajectory/               #   Trajectory ledger
│   └── work-contract/            #   Compaction packet, chain executor
├── plugin/                       # Plugin-level tests
├── plugins/                      # Plugin lifecycle and integration tests
├── schema-kernel/                # Zod schema tests
├── shared/                       # Shared utility tests
├── sidecar/                      # Sidecar readonly state tests
├── task-management/              # Task management tests
│   ├── continuity/               #   Store cache tests
│   └── trajectory/               #   Store operations, types, index, ledger
└── tools/                        # Tool tests — mirrors src/tools/ (26 files)
    ├── delegation/               #   Delegate-task v2, delegation-status v2, E2E
    └── hivemind/                 #   Session tracker, hierarchy, session context

eval/
├── stability.test.ts
├── coherence.test.ts
└── correctness.test.ts
```

**Categories of tests:**

| Category | Count | Purpose |
|----------|-------|---------|
| Core library (`tests/lib/`) | ~56 files | Unit tests for `src/` modules — helpers, delegation, continuity, runtime |
| Tools (`tests/tools/`) | ~26 files | Tool-level tests for `src/tools/` — delegate-task, session, bootstrap |
| Hooks (`tests/hooks/`) | ~19 files | Hook factory tests — core, session, tool-guard, CQRS boundary |
| Integration (`tests/integration/`) | ~13 files | Cross-module integration — delegation, continuity, session-tracker |
| Features (`tests/features/`) | ~4 subdirs | Runtime pressure, governance, work contracts, session tracker |
| Other (`tests/`) | ~128 more | CLI, plugin, schema-kernel, sidecar, coordination, task-management |
| Eval (`eval/`) | 3 files | Stability, coherence, correctness evaluations |

## Writing New Tests

### File naming

Test files follow the pattern `{module-name}.test.ts` and live in the `tests/` directory matching `src/` structure:

```
src/shared/helpers.ts                        → tests/lib/helpers.test.ts
src/tools/delegation/delegate-task.ts        → tests/tools/delegation/delegate-task.test.ts
src/hooks/create-core-hooks.ts               → tests/hooks/create-core-hooks.test.ts
src/cli/index.ts                             → tests/cli/runCli.test.ts  (hypothetical)
src/schema-kernel/prompt-enhance.schema.ts   → tests/schema-kernel/prompt-enhance.schema.test.ts
```

### Imports

Import the module under test from `src/` using `.js` extensions (matching the project's ESM output with `verbatimModuleSyntax`):

```ts
import { describe, it, expect, beforeEach, vi } from "vitest"
import { isObject, getNestedValue } from "../../src/shared/helpers.js"
```

### Vitest globals

The config enables `globals: true`. However, most test files use **explicit imports** from `"vitest"` for clarity and IDE support:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
```

### Test conventions

- **`describe`** blocks group related functionality (e.g., `describe("isObject", () => { ... })`).
- **`it`** blocks are written as present-tense assertions: `it("returns true for plain objects", () => {...})`.
- **Setup/teardown** uses `beforeEach`/`afterEach` within `describe` blocks — not global setup files.
- **Module resets** for tests that depend on env-var driven module initialization: `vi.resetModules()` in `beforeEach` to prevent stale module state.
- **No shared test helpers directory** — each test file is self-contained. Some tests define inline helper functions (e.g., `makeRecord()` in continuity tests) scoped to the module.
- **Type imports** use `import type` per the project's `verbatimModuleSyntax: true` rule.

### Example

```ts
import { describe, it, expect } from "vitest"
import { isObject } from "../../src/shared/helpers.js"

describe("isObject", () => {
  it("returns true for plain objects", () => {
    expect(isObject({})).toBe(true)
    expect(isObject({ a: 1 })).toBe(true)
  })

  it("returns false for null", () => {
    expect(isObject(null)).toBe(false)
  })

  it("returns false for arrays", () => {
    expect(isObject([])).toBe(false)
  })
})
```

## Coverage Requirements

Coverage is measured using `@vitest/coverage-v8` (v8 provider) and enforced via CI thresholds in `vitest.config.ts`:

| Type | Threshold | Current baseline (approx.) |
|------|-----------|---------------------------|
| Statements | 75% | ~90% |
| Branches | 62% | ~79% |
| Functions | 80% | ~92% |
| Lines | 77% | ~91% |

Coverage is reported in three formats:
- **text** — console summary
- **lcov** — HTML reports and editor integration
- **json-summary** — machine-parseable for CI automation and dashboards

To view an HTML coverage report:

```bash
npm run test:coverage
# Open coverage/lcov-report/index.html in a browser
```

### Coverage rules

- **Source files:** `src/**/*.ts`
- **Excluded:** `src/index.ts` and `src/**/index.ts` (re-export-only files)
- **Floor policy:** Thresholds should never be lowered without an explicit audit amendment (per Phase 48.4.1, Phase P39-04).
- **Thresholds adjusted 2026-05-30** (P39-04 audit) to reflect actual coverage +5pp margin.

## Type Checking

All tests must pass type checking before committing:

```bash
npm run typecheck    # tsc --noEmit — checks src/ only (tests excluded from tsconfig)
```

The `tsconfig.json` sets `strict: true` with `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, and `verbatimModuleSyntax`. See `tsconfig.json` for the full set of compiler options.

## Build Verification

Before committing, verify the build compiles cleanly:

```bash
npm run build    # Clean + compile TypeScript to dist/ with declarations + source maps
```

The build step also runs `node scripts/sync-assets.js` and generates the config JSON schema.

## CI Integration

Tests run automatically on **every push and pull request** to `oss-dev` and `main` branches via `.github/workflows/ci.yml`:

| Workflow | File | Trigger | Node versions |
|----------|------|---------|---------------|
| CI (Build & Test) | `.github/workflows/ci.yml` | Push/PR to `oss-dev` or `main` | 20, 22 |
| CI (Lint & Format) | `.github/workflows/ci.yml` | Push/PR to `oss-dev` or `main` | 22 |

The **Build & Test** job runs:
1. `npm ci` — clean install
2. `npm run typecheck` — type checking
3. `npm run build` — production build
4. `npm test` — full test suite
5. `npm run test:coverage` — coverage report (Node 22 only)

The **Lint & Format** job runs type checking (`npm run typecheck`).

### Local verification checklist

Always run these before pushing:

```bash
npm run typecheck    # Type-check without emitting — must pass
npm run build        # Build must compile cleanly
npm test             # Full test suite must pass (all 2,963 tests)
```

## Additional Verification: OSS Sync

The `.github/workflows/sync-oss.yml` workflow (triggered manually via `workflow_dispatch`) also runs `npm test` after syncing source changes to the public `oss-dev` branch, ensuring the OSS branch remains buildable and testable.
