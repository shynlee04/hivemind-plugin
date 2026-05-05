<!-- generated-by: gsd-doc-writer -->

# Testing

## Test Framework and Setup

The harness uses [Vitest](https://vitest.dev) (`>=4.1.5`) with globals enabled. No additional setup script is required — `vitest.config.ts` configures the test environment automatically.

**Framework:** Vitest 4.x with `@vitest/coverage-v8` for coverage reporting.  
**Test location:** `tests/` directory mirrors `src/` structure: `tests/lib/` for core library tests, `tests/tools/` for tool tests, `tests/hooks/` for hook factory tests, `tests/cli/` for CLI substrate tests, `tests/schema-kernel/` for Zod schema tests.  
**Additional test root:** `eval/` contains stability, coherence, and correctness evaluation tests (`eval/*.test.ts`) that are included in the test suite.  
**Globals:** `vitest.config.ts` sets `globals: true`, so `describe`, `it`, `expect`, `beforeEach`, `afterEach`, `vi` are available without explicit imports in most test files. Some test files import them explicitly from `vitest` for clarity.

**Prerequisites:** `npm install` — no environment variables are required to run tests. When `NODE_ENV=test`, the SDK session ID sanitizer relaxes its prefix-stripping rules to allow `child-` and `parent-` prefixed session IDs for test isolation.

## Running Tests

| Command | What it runs |
|---------|-------------|
| `npm test` | Entire test suite — all `tests/**/*.test.ts` and `eval/**/*.test.ts` files |
| `npm run test:watch` | Watch mode — re-runs affected tests on file changes |
| `npm run test:coverage` | Full suite with coverage report (text, lcov, json-summary) |
| `npx vitest run tests/lib/helpers.test.ts` | Single test file |
| `npx vitest run -t "isObject returns false for null"` | Single test by pattern |

```bash
# Run the full suite (currently ~1,163 tests)
npm test

# Run all tests in a specific directory
npx vitest run tests/lib/spawner/

# Run all tests matching a pattern
npx vitest run -t "DelegationConcurrencyQueue"

# Watch mode for iterative development
npm run test:watch
```

The test suite contains **129 test files** (plus 3 eval tests) as of the current codebase. All tests are expected to pass on commit.

## Writing New Tests

### File naming

Test files follow the pattern `{module-name}.test.ts` and live in the `tests/` directory matching the `src/` structure:

```
src/lib/helpers.ts          → tests/lib/helpers.test.ts
src/tools/delegate-task.ts  → tests/tools/delegate-task.test.ts
src/hooks/create-core-hooks.ts → tests/hooks/create-core-hooks.test.ts
src/cli/index.ts            → tests/cli/runCli.test.ts
src/schema-kernel/prompt-enhance.schema.ts → tests/schema-kernel/prompt-enhance.schema.test.ts
```

### Imports

Import the module under test from `src/` using `.js` extensions (matching the project's ESM output):

```ts
import { isObject, getNestedValue } from "../../src/lib/helpers.js"
```

### Vitest globals

The config enables `globals: true`. Most test files use explicit imports from `vitest`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
```

Explicit imports are preferred over relying on globals for clarity and IDE support.

### Test patterns

The codebase follows these conventions:

- **`describe`** blocks group related functionality (e.g., `describe("isObject", () => { ... })`).
- **`it`** blocks are written as present-tense assertions: `it("returns true for plain objects", () => {...})`.
- **Setup/teardown** uses `beforeEach`/`afterEach` within `describe` blocks — not global setup files. Example: state directory mocking in `tests/lib/continuity.test.ts` creates a temp dir in `beforeEach` and cleans up in `afterEach`.
- **Module resets** for tests that depend on env-var driven module initialization: `vi.resetModules()` in `beforeEach` to prevent stale module state.
- **No shared test helpers directory** — each test file is self-contained. Some tests define inline helper functions (e.g., `makeRecord()` in `continuity.test.ts`) scoped to the module.

### Coverage expectations

New code should maintain or improve coverage. The minimum thresholds in `vitest.config.ts` are:

| Type | Threshold |
|------|-----------|
| Statements | 85% |
| Branches | 72% |
| Functions | 85% |
| Lines | 85% |

The current baseline (measured on Node 20, vitest 4.1.5) is approximately 90% statements, 79% branches, 92% functions, 91% lines. The floor sits ~5pp below actual to absorb normal churn while catching real regressions.

Sources are included from `src/**/*.ts` and excluded for re-export-only index files (`src/index.ts`, `src/**/index.ts`).

## Coverage Requirements

Coverage is measured using `@vitest/coverage-v8` (v8 provider) and enforced via CI thresholds (see `vitest.config.ts`):

```ts
thresholds: {
  statements: 85,
  branches: 72,
  functions: 85,
  lines: 85,
}
```

Coverage is reported in three formats:
- **text** — console summary
- **lcov** — for HTML reports and editor integration
- **json-summary** — machine-parseable for CI automation and dashboards

To view an HTML coverage report:

```bash
npm run test:coverage
# Open coverage/lcov-report/index.html in a browser
```

### Coverage rules

- Source files: `src/**/*.ts`
- Excluded: `src/index.ts` and `src/**/index.ts` (re-export-only files)
- The floor should never be lowered without an explicit audit amendment (per Phase 48.4.1).

## CI Integration

Tests are not directly run via a dedicated GitHub Actions test workflow. The project's current CI configuration focuses on agent-driven workflows:

| Workflow | File | Trigger |
|----------|------|---------|
| `opencode` | `.github/workflows/opencode.yml` | `/oc` or `/opencode` comment on issues/PRs — dispatches OpenCode agent with `glm-5.1` model |
| `qwen-dispatch` | `.github/workflows/qwen-dispatch.yml` | Comment-triggered Qwen agent dispatch |
| `qwen-invoke` | `.github/workflows/qwen-invoke.yml` | Comment-triggered Qwen agent invocation |
| `qwen-scheduled-triage` | `.github/workflows/qwen-scheduled-triage.yml` | Scheduled Qwen issue triage |
| `qwen-triage` | `.github/workflows/qwen-triage.yml` | Comment-triggered Qwen issue triage |

**Local verification is required before pushing:**

```bash
npm run typecheck    # Type-check without emitting
npm test             # Full test suite must pass
```

There is no dedicated CI test job that runs `npm test` on push/PR at this time. Ensure all tests pass locally before submitting code.

## Test Structure

```
tests/
├── cli/                          # CLI substrate tests (runCli, router, discovery, renderer)
├── hooks/                        # Hook factory tests (core, session, tool-guard, CQRS boundary)
├── integration/                  # Integration-level tests
├── kernel/                       # Kernel-level tests
├── lib/                          # Core library tests — mirrors src/lib/
│   ├── spawner/                  #   Session creator, spawn request builder, parent dir, agent policy, concurrency key
│   ├── recovery/                 #   Recovery engine: repair state, checkpoint creation, state assessment, failure classes
│   ├── runtime-detection/        #   Code scanning, codemap, file watcher, stack synthesizer
│   ├── prompt-packet/            #   Delegation packet, kernel packet, compaction preservation
│   ├── runtime-pressure/         #   Model, phase67-conformance, authority matrix, phase59-authority, control plane
│   ├── config-workflow/          #   Workflow state, regression, guards, persistence, E2E
│   ├── doc-intelligence/         #   Router, chunker, parser
│   ├── trajectory/               #   Trajectory ledger
│   ├── supervisor/               #   Command bundle, health, messages transform, context renderer
│   ├── control-plane/            #   Gatekeeper
│   ├── security/                 #   Redaction, path scope
│   ├── work-contract/            #   Compaction packet, chain executor, intent classifier, agent work contract
│   ├── command-engine/           #   Command engine tests
│   └── agent-work-contracts/     #   Work contract store
├── plugins/                      # Plugin-level tests
├── schema-kernel/                # Zod schema tests (prompt-enhance, opencode-config)
├── sidecar/                      # Sidecar readonly state tests
└── tools/                        # Tool tests — mirrors src/tools/
