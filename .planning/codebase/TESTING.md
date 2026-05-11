# Testing Patterns

**Analysis Date:** 2026-05-12

## Test Framework

**Runner:**
- **Vitest** ^4.1.5 (`@vitest/coverage-v8` ^4.1.5)
- Config: `vitest.config.ts` at project root

**Assertion Library:**
- Vitest built-in (`expect`)

**Run Commands:**
```bash
npm test                    # vitest run — run all tests
npm run test:watch          # vitest — watch mode
npm run test:coverage       # vitest run --coverage — with report
npx vitest run tests/lib/helpers.test.ts    # single test file
npx vitest run -t "isObject"                # tests matching name pattern
```

## Test Configuration

**`vitest.config.ts`:**
```typescript
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
        statements: 85,
        branches: 72,
        functions: 85,
        lines: 85,
      },
    },
  },
})
```

**Key notes:**
- `globals: true` — Vitest global APIs available, but tests explicitly import `{ describe, it, expect, vi }` from `vitest`
- Coverage excludes `src/index.ts` and all `src/**/index.ts` barrel files
- Coverage thresholds locked at 85/72/85/85 (statements/branches/functions/lines) — must never be lowered without an explicit audit amendment
- 3 output formats: `text` (console), `lcov` (IDE), `json-summary` (CI automation)

## Test File Organization

**Location:**
- Tests are **not** co-located with source — they live in a parallel `tests/` directory
- Directory structure mirrors `src/` layout:

```
tests/
├── lib/                   # Tests for src/shared/, src/coordination/, src/task-management/, src/features/
│   ├── helpers.test.ts
│   ├── delegation-manager.test.ts
│   ├── continuity.test.ts
│   ├── event-tracker/
│   │   ├── writer.test.ts
│   │   ├── classifier.test.ts
│   │   └── ...
│   └── ... (~100 test files)
├── tools/                 # Tests for src/tools/
│   ├── delegate-task.test.ts
│   ├── hivemind-doc.test.ts
│   ├── prompt-skim.test.ts
│   └── ... (~15 test files)
├── hooks/                 # Tests for src/hooks/
│   ├── create-core-hooks.test.ts
│   ├── create-session-hooks.test.ts
│   ├── toggle-gates.test.ts
│   └── ... (~8 test files)
├── schema-kernel/         # Tests for src/schema-kernel/
│   ├── hivemind-configs.schema.test.ts
│   ├── prompt-enhance.schema.test.ts
│   └── ... (~5 test files)
├── cli/                   # Tests for src/cli/
│   ├── router.test.ts
│   ├── renderer.test.ts
│   └── ... (~7 test files)
├── plugin/                # Tests for plugin bootstrap
├── plugins/               # Plugin lifecycle tests
├── integration/           # Integration tests (1 file)
├── sidecar/               # Sidecar tests
├── features/              # Feature-level tests
└── kernel/                # Kernel tests
```

**Naming:**
- Test files mirror source names with `.test.ts` extension: `helpers.ts` → `helpers.test.ts`
- No `.spec.ts` files — all test files use `.test.ts`

**File count:** 149 test files (verified: ~149 `.test.ts` files in `tests/`)

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect } from "vitest"
import { isObject, getNestedValue, asString } from "../../src/shared/helpers.js"

describe("isObject", () => {
  it("returns true for plain objects", () => {
    expect(isObject({})).toBe(true)
    expect(isObject({ a: 1 })).toBe(true)
  })

  it("returns false for null", () => {
    expect(isObject(null)).toBe(false)
  })
})
```

**Patterns:**
- `describe("moduleName", () => { ... })` at top level for module
- `describe("functionName", () => { ... })` for function-level grouping
- `it("returns X when Y", () => { ... })` — descriptive lowercase assertions
- One logical behavior per `it()` block
- Nested `describe()` for different scenarios
- Separate `describe()` blocks for related function groups (e.g., `buildPromptText with session context` in `tests/lib/helpers.test.ts:385`)

## Test Lifecycle

**Setup/Teardown Patterns:**

1. **Environment variable save/restore** (most common pattern in `tests/lib/` and `tests/tools/`):
```typescript
// From tests/lib/continuity.test.ts
describe("continuity persistence", () => {
  let stateDir: string
  let previousStateDir: string | undefined

  beforeEach(() => {
    vi.resetModules()
    vi.unmock("node:fs")
    previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
    stateDir = mkdtempSync(join(tmpdir(), "continuity-test-"))
    process.env.OPENCODE_HARNESS_STATE_DIR = stateDir
  })

  afterEach(() => {
    vi.doUnmock("node:fs")
    vi.resetModules()
    if (previousStateDir === undefined) {
      delete process.env.OPENCODE_HARNESS_STATE_DIR
    } else {
      process.env.OPENCODE_HARNESS_STATE_DIR = previousStateDir
    }
    rmSync(stateDir, { recursive: true, force: true })
  })
})
```

2. **Dynamic import pattern** for modules affected by env vars:
```typescript
const continuity = await import("../../src/task-management/continuity/index.js")
```

3. **Fake timers** for timeout-dependent tests:
```typescript
// From tests/lib/completion-detector.test.ts
beforeEach(() => {
  vi.useFakeTimers()
  detector = new CompletionDetector(100)
})
afterEach(() => {
  vi.useRealTimers()
})
```

## Mocking

**Framework:** Vitest built-in (`vi` from `vitest`)

**Patterns:**

1. **`vi.fn()` — Function mocks:**
```typescript
// From tests/tools/delegate-task.test.ts
function createManagerStub(): ToolManagerStub {
  return {
    dispatch: vi.fn().mockResolvedValue({
      status: "dispatched",
      delegationId: "delegation-dispatch-123",
      executionMode: "sdk",
    }),
  }
}
```

2. **`vi.spyOn()` — Method spies** (used in hook tests):
```typescript
vi.spyOn(lifecycleManager, "handleEvent")
```

3. **`vi.mock()` — Module-level mocks** for whole-module replacement

4. **`vi.resetModules()` + dynamic import** — Clean module graph between tests:
```typescript
// From tests/lib/continuity.test.ts
beforeEach(() => {
  vi.resetModules()
  vi.unmock("node:fs")
})

// Dynamic import inside test to get fresh module
const continuity = await import("../../src/task-management/continuity/index.js")
```

5. **`vi.restoreAllMocks()` — Cleanup in afterEach:**
```typescript
afterEach(() => {
  vi.restoreAllMocks()
})
```

6. **Type-safe mock objects** — explicit mock types defined:
```typescript
// From tests/tools/delegate-task.test.ts
type MockClient = {
  session: {
    create: ReturnType<typeof vi.fn>
    prompt: ReturnType<typeof vi.fn>
    promptAsync: ReturnType<typeof vi.fn>
    status: ReturnType<typeof vi.fn>
    messages: ReturnType<typeof vi.fn>
    abort: ReturnType<typeof vi.fn>
  }
  app: {
    agents: ReturnType<typeof vi.fn>
  }
}
```

7. **Wildcard module import for spy injection** (integration-boundary tests):
```typescript
// From tests/lib/delegation-manager.test.ts:26
// vitest's module graph allows spying on the config-subscriber export
// and all consumers of that export will see the spy.
import * as configSubscriber from "../../src/config/subscriber.js"
```

**What to Mock:**
- External SDKs and clients (`@opencode-ai/plugin`, session API, file system for persistence tests)
- Environment-specific features (PTY manager, `bun-pty`)
- Module boundaries (config subscriber, delegation handlers)

**What NOT to Mock:**
- Pure utility functions (test them directly)
- Type definitions and schemas
- Internal helper functions in the same module under test

## Fixtures and Factories

**Test Data Factories:**
```typescript
// From tests/lib/continuity.test.ts
function makeRecord(sessionID: string): SessionContinuityRecord {
  return {
    sessionID,
    promptParams: {},
    metadata: {
      status: "running",
      description: `record ${sessionID}`,
      delegation: null,
      constraints: [],
      pendingNotifications: [],
      updatedAt: Date.now(),
    },
  }
}

// From tests/tools/delegate-task.test.ts
function createMockClient(): MockClient { ... }
function createManagerStub(): ToolManagerStub { ... }
function parseResult(raw: string): Record<string, unknown> { ... }
```

**Location:**
- Factory helpers defined inline in test files (not extracted to shared fixtures)
- No separate fixtures directory — each test file defines its own helpers

**Temp directories:**
- `mkdtempSync(join(tmpdir(), "continuity-test-"))` pattern for filesystem tests
- Cleaned up with `rmSync(stateDir, { recursive: true, force: true })` in `afterEach`

## Coverage

**Requirements:**
| Metric | Threshold |
|--------|-----------|
| Statements | 85% |
| Branches | 72% |
| Functions | 85% |
| Lines | 85% |

**Current measured (audit 2026-04-30):** ~89.94% statements / 79.25% branches / 92.38% functions / 90.95% lines

**Enforcement:**
- Thresholds enforced via `vitest.config.ts` — test run fails if any metric drops below floor
- Floor sits ~5pp below actual to absorb normal churn
- Floor must **never** be lowered without an explicit audit amendment

**View Coverage:**
```bash
npm run test:coverage
```

**Excluded from coverage:**
- `src/index.ts` — main barrel export
- `src/**/index.ts` — all barrel files
- `node_modules/`, `dist/`, `tests/`

## Test Types

**Unit Tests (100% of test suite):**
- All 149 test files are unit tests
- Tests focus on individual modules in isolation:
  - Pure function tests (`tests/lib/helpers.test.ts` — 505 lines, covers 11 functions)
  - Class behavior tests (`tests/lib/delegation-manager.test.ts` — 3351 lines, covers DelegationManager)
  - Schema validation tests (`tests/schema-kernel/hivemind-configs.schema.test.ts`)
  - Tool contract tests (`tests/tools/delegate-task.test.ts` — 481 lines)
  - Hook wiring tests (`tests/hooks/create-core-hooks.test.ts` — 796 lines)
- All use mocked boundaries — no live OpenCode sessions

**Integration Tests:**
- **1 file** detected: `tests/integration/prompt-enhance-pipeline.test.ts`
- Currently minimal — most pipelines tested via unit-level wiring

**E2E / Live Tests:**
- **None** — no production OpenCode integration tests exist
- All runtime claims require non-mocked evidence from separate verification workflows

## Common Patterns

**Async Testing:**
```typescript
// From tests/lib/completion-detector.test.ts
it("resolves with idle when session.idle is fed", async () => {
  const resultPromise = detector.watch("ses_1", 5000)
  detector.feed("session.idle", "ses_1")
  await expect(resultPromise).resolves.toEqual({
    signal: "idle",
    sessionID: "ses_1",
  })
})
```

**Error Testing:**
```typescript
// From tests/lib/helpers.test.ts
it("throws on error property with string message", () => {
  expect(() => unwrapData({ error: "Something went wrong" })).toThrow(
    "[Harness] Something went wrong"
  )
})

// From tests/lib/continuity.test.ts
expect(() => continuity.listSessionContinuity()).toThrow(/^\[Harness\]/)
```

**Partial Object Matching:**
```typescript
// From tests/hooks/create-core-hooks.test.ts
expect(lm.handleEvent).toHaveBeenCalledWith({
  event: expect.objectContaining({ type: "session.created" }),
  eventType: "session.created",
  sessionID: "ses_test",
})
```

**Timestamp Verification:**
```typescript
// Many tests verify Date.now()-based stamps with expect.any(Number) or range checks
```

**Temp File I/O for Persistence Tests:**
```typescript
// Pattern: create temp dir → write fixture → test → cleanup
const stateDir = mkdtempSync(join(tmpdir(), "my-test-"))
writeFileSync(join(stateDir, "test.json"), JSON.stringify(fixture), "utf-8")
// ... assertions ...
rmSync(stateDir, { recursive: true, force: true })
```

---

*Testing analysis: 2026-05-12*
