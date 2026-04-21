# Testing Patterns

> Generated: 2026-04-21
> Agent: gsd-codebase-mapper (quality-focus)

## Test Framework

**Runner:**
- Vitest ^1.0.0
- Config: `vitest.config.ts`

**Assertion Library:**
- Vitest built-in (`expect`, `describe`, `it`, `beforeEach`, `afterEach`, `vi`)

**Run Commands:**
```bash
npm test                  # Run all tests (vitest run)
npm run test:watch        # Watch mode (vitest)
npm run test:coverage     # Coverage report — REQUIRES @vitest/coverage-v8 (not installed)
npm run typecheck         # Type-check without emitting (tsc --noEmit)
```

**Vitest Config:**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,                        // No imports needed for describe/it/expect
    include: ['tests/**/*.test.ts'],      // Test file pattern
    coverage: {
      include: ['src/**/*.ts'],           // Only measure coverage on src/
      exclude: ['src/index.ts', 'src/**/index.ts'],  // Exclude barrel files
      reporter: ['text', 'lcov'],
    },
  },
})
```

## Test File Organization

**Location:** Separate directory — `tests/` mirrors `src/` structure

**Directory Structure:**
```
tests/
├── lib/                                      # Unit tests for src/lib/
│   ├── helpers.test.ts                       # 452 LOC, 59 tests
│   ├── concurrency.test.ts                   # 375 LOC, 24 tests
│   ├── completion-detector.test.ts           # 326 LOC, 24 tests
│   ├── completion-detector-crash.test.ts     # 238 LOC, 11 tests
│   ├── delegation-manager.test.ts            # 1099 LOC, 49 tests
│   ├── notification-handler.test.ts          # 262 LOC, 15 tests
│   ├── runtime-policy.test.ts                # 253 LOC, 22 tests
│   ├── session-api.test.ts                   # 478 LOC, 39 tests
│   ├── state.test.ts                         # 207 LOC, 20 tests
│   └── task-status.test.ts                   # 199 LOC, 34 tests
├── tools/                                    # Tool-focused tests
│   ├── delegate-task.test.ts                 # 253 LOC, 15 tests
│   ├── delegation-status.test.ts             # 264 LOC, 12 tests
│   ├── prompt-analyze.test.ts                # 129 LOC, 9 tests
│   ├── prompt-skim.test.ts                   # 120 LOC, 8 tests
│   └── session-patch.test.ts                 # 193 LOC, 8 tests
├── schema-kernel/                            # Schema validation tests
│   └── prompt-enhance.schema.test.ts         # 457 LOC, 46 tests
├── integration/                              # E2E integration tests
│   └── prompt-enhance-pipeline.test.ts       # 250 LOC, 12 tests
└── plugins/                                  # Plugin-specific tests
    └── prompt-enhance-compaction.test.ts     # 10 LOC, 1 test (skipped)
```

**Naming Convention:**
- Test files: `{source-module-name}.test.ts`
- Test file path mirrors source path: `src/lib/helpers.ts` → `tests/lib/helpers.test.ts`
- Import paths use `../../src/` relative paths

## Test Structure

### Suite Organization Pattern

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { functionUnderTest } from "../../src/lib/module.js"
import type { TypeNeeded } from "../../src/lib/types.js"

describe("ModuleName", () => {
  // Shared state (reset in beforeEach)
  let instance: ModuleClass

  beforeEach(() => {
    instance = new ModuleClass()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Logical grouping with nested describe blocks
  describe("feature area", () => {
    it("should do something specific", () => {
      // Arrange
      const input = ...
      // Act
      const result = functionUnderTest(input)
      // Assert
      expect(result).toBe(expected)
    })
  })

  describe("edge cases", () => {
    it("handles edge case", () => { ... })
  })
})
```

### Section Separator Pattern
Tests use comment separators to visually group test areas:
```typescript
// ---------------------------------------------------------------------------
// Feature area description
// ---------------------------------------------------------------------------

describe("feature area", () => { ... })
```

### Dynamic Import Pattern
Some test files use dynamic imports to avoid side effects:
```typescript
describe("task-status", () => {
  it("should contain all 8 statuses", async () => {
    const { VALID_TASK_STATUSES } = await import("../../src/lib/task-status.js")
    expect(VALID_TASK_STATUSES).toHaveLength(8)
  })
})
```

## Mocking

### Framework
Vitest built-in mocking via `vi`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
```

### Stub/Factory Pattern
Tests create typed stubs for dependencies rather than using mock frameworks:

```typescript
type ManagerStub = {
  dispatch: ReturnType<typeof vi.fn>
}

function createManagerStub(): ManagerStub {
  return {
    dispatch: vi.fn().mockResolvedValue({
      status: "dispatched",
      delegationId: "delegation-dispatch-123",
    }),
  }
}

// Usage — cast with `as never` for stub-to-real substitution
const tool = createDelegateTaskTool(createManagerStub() as never)
```

### Mock Context Pattern
Tool tests define a reusable mock context:
```typescript
const mockCtx = {
  sessionID: "parent-session",
  agent: "builder",
  directory: process.cwd(),
  worktree: process.cwd(),
  abort: new AbortController().signal,
  metadata: () => ({}),
  ask: async () => ({ state: "approved" as const }),
}
```

### Spy Pattern
Use `vi.spyOn` for observing method calls on real objects:
```typescript
const idleSpy = vi.spyOn(DelegationManager.prototype, "handleSessionIdle")
// ... exercise code ...
expect(idleSpy).toHaveBeenCalledWith("child-from-info-id")
```

### Fake Timers
Timer-dependent code uses fake timers:
```typescript
beforeEach(() => {
  vi.useFakeTimers()
  detector = new CompletionDetector(100)
})

afterEach(() => {
  vi.useRealTimers()
})

// In tests:
vi.advanceTimersByTime(100)
```

### What to Mock
- **External SDK clients** — `client.session.prompt`, `client.session.status`
- **DelegationManager** — stub with `vi.fn()` for dispatch/getStatus
- **File system** — use `tmpdir()` for real temp files in integration tests
- **Environment variables** — save and restore in `beforeEach`/`afterEach`

### What NOT to Mock
- **Pure utility functions** — test `isObject()`, `asString()`, `stableStringify()` directly
- **State transitions** — test `canTransition()`, `isTerminal()` with real data
- **Data transformations** — test `transformMessages()`, `buildNotificationMessage()` with real inputs
- **Concurrency logic** — test `DelegationConcurrencyQueue` with real async operations

## Fixtures and Factories

### Test Data Factories
Tests define factory functions for creating test data:

```typescript
function makeDelegation(overrides: Partial<Delegation> = {}): Delegation {
  return {
    id: "del-001",
    parentSessionId: "parent-session",
    childSessionId: "child-session",
    agent: "builder",
    status: "running",
    createdAt: Date.now(),
    safetyCeilingMs: 180_000,
    lastMessageCount: 0,
    stablePollCount: 0,
    ...overrides,
  }
}

const makeValidMeta = (rootID: string): DelegationMeta => ({
  rootID,
  depth: 1,
  budgetUsed: 1,
  agent: "builder",
  queueKey: "default",
})
```

### Test Helpers
Common patterns extracted as test-local helpers:
```typescript
function parseResult(raw: string): Record<string, unknown> {
  return JSON.parse(raw) as Record<string, unknown>
}
```

### Temp Files for Integration Tests
Integration tests use Node.js `tmpdir()`:
```typescript
const testDir = join(tmpdir(), `pipeline-e2e-${Date.now()}`)
mkdirSync(testDir, { recursive: true })
// ... use testDir ...
afterEach(() => {
  try { rmSync(testDir, { recursive: true, force: true }) } catch { /* ignore */ }
})
```

## Coverage

**Requirements:** `@vitest/coverage-v8` is NOT currently installed. Coverage reports cannot be generated.

**Coverage Config:**
- Include: `src/**/*.ts`
- Exclude: `src/index.ts`, `src/**/index.ts` (barrel files)
- Reporter: text, lcov

**Estimated Coverage by Module:**

| Source Module | Has Test File | Test Count | Notes |
|---|---|---|---|
| `src/lib/helpers.ts` | ✅ `tests/lib/helpers.test.ts` | 59 tests | Comprehensive |
| `src/lib/task-status.ts` | ✅ `tests/lib/task-status.test.ts` | 34 tests | Exhaustive transitions |
| `src/lib/state.ts` | ✅ `tests/lib/state.test.ts` | 20 tests | Full coverage |
| `src/lib/concurrency.ts` | ✅ `tests/lib/concurrency.test.ts` | 24 tests | Includes SpawnReservation |
| `src/lib/completion-detector.ts` | ✅ 2 test files | 35 tests | Normal + crash scenarios |
| `src/lib/delegation-manager.ts` | ✅ `tests/lib/delegation-manager.test.ts` | 49 tests | Largest test file (1099 LOC) |
| `src/lib/notification-handler.ts` | ✅ `tests/lib/notification-handler.test.ts` | 15 tests | Bug regression included |
| `src/lib/session-api.ts` | ✅ `tests/lib/session-api.test.ts` | 39 tests | SDK wrapper tests |
| `src/lib/runtime-policy.ts` | ✅ `tests/lib/runtime-policy.test.ts` | 22 tests | Validation + merging |
| `src/lib/continuity.ts` | ❌ None | 0 tests | **GAP — 401 LOC, no direct tests** |
| `src/lib/lifecycle-manager.ts` | ❌ None | 0 tests | **GAP — 135 LOC, no direct tests** |
| `src/lib/runtime.ts` | ❌ None | 0 tests | Small (95 LOC), tested indirectly |
| `src/tools/delegate-task.ts` | ✅ `tests/tools/delegate-task.test.ts` | 15 tests | Plugin registration + dispatch |
| `src/tools/delegation-status.ts` | ✅ `tests/tools/delegation-status.test.ts` | 12 tests | Filtering + validation |
| `src/tools/prompt-skim/` | ✅ `tests/tools/prompt-skim.test.ts` | 8 tests | |
| `src/tools/prompt-analyze/` | ✅ `tests/tools/prompt-analyze.test.ts` | 9 tests | |
| `src/tools/session-patch/` | ✅ `tests/tools/session-patch.test.ts` | 8 tests | |
| `src/schema-kernel/` | ✅ `tests/schema-kernel/` | 46 tests | Schema validation |
| `src/hooks/` | ⚠️ Indirect only | — | Tested via integration tests |
| `src/plugin.ts` | ⚠️ Indirect only | — | Tested via integration + tool tests |

## Test Types

### Unit Tests
- **Scope:** Individual functions, classes, and modules in isolation
- **Location:** `tests/lib/`, `tests/tools/`, `tests/schema-kernel/`
- **Pattern:** Import source directly, stub dependencies, test behavior
- **Total:** ~407 passing unit tests across 17 test files

### Integration Tests
- **Scope:** Cross-module interactions, schema-to-tool pipeline, plugin registration
- **Location:** `tests/integration/`
- **Pattern:** Create real tool instances, exercise full pipeline, validate end-to-end
- **File:** `tests/integration/prompt-enhance-pipeline.test.ts` — 12 tests
- **Tests:**
  - Schema contracts match tool outputs
  - messages.transform detects triggers
  - Full pipeline E2E (skim → analyze → patch → transform)
  - Plugin tool registration

### E2E Tests
- No dedicated E2E test framework
- The integration tests serve as lightweight E2E tests with real file I/O

## Common Patterns

### Async Testing
```typescript
it("concurrent acquires serialize when limit is 1", async () => {
  const results: number[] = []
  const limit = 1

  const run = async (n: number) => {
    const release = await queue.acquire("limit-1-key", limit)
    results.push(n)
    await Promise.resolve()  // Yield tick
    release()
  }

  await Promise.all([run(1), run(2), run(3)])
  expect(results.sort()).toEqual([1, 2, 3])
})
```

### Error Testing
```typescript
it("throws [Harness]-prefixed error when budget exceeded", () => {
  for (let i = 0; i < MAX_DESCENDANTS_PER_ROOT; i++) {
    reserveSubagentSpawn(`parent-${i}`, "root-limit", mgr)
  }
  expect(() =>
    reserveSubagentSpawn("parent-over", "root-limit", mgr)
  ).toThrow(/^\[Harness\]/)
})
```

### Rejection Testing
```typescript
it("rejects with [Harness] error on timeout", async () => {
  const r1 = await queue.acquire("timeout-key", 1)
  await expect(
    queue.acquire("timeout-key", 1, 50),
  ).rejects.toThrow(/\[Harness\].*timed out/)
  r1()
})
```

### Zod Schema Validation Testing
```typescript
it("validates required agent parameter", async () => {
  const tool = createDelegateTaskTool(createManagerStub() as never)
  await expect(
    tool.execute({ prompt: "work" } as never, mockCtx)
  ).rejects.toHaveProperty("name", "ZodError")
})
```

### Environment Variable Testing
```typescript
let previousStateDir: string | undefined

beforeEach(() => {
  previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
})

afterEach(() => {
  vi.restoreAllMocks()
  if (previousStateDir === undefined) {
    delete process.env.OPENCODE_HARNESS_STATE_DIR
  } else {
    process.env.OPENCODE_HARNESS_STATE_DIR = previousStateDir
  }
})
```

## Test Gaps

### Critical Missing Tests

**`src/lib/continuity.ts` (401 LOC) — NO direct tests:**
- File I/O operations (load, persist, normalize)
- Deep-clone-on-read behavior
- Session CRUD operations
- Governance persistence
- Hydration logic
- This is the largest untested module and handles durable state

**`src/lib/lifecycle-manager.ts` (135 LOC) — NO direct tests:**
- Session lifecycle state machine transitions
- Event→status mapping
- Background completion observation
- Cancellation handling
- Note: Reduced from ~500 LOC but still critical

**`src/hooks/` (5 files) — NO direct tests:**
- `create-core-hooks.ts` — event routing, system.transform, shell.env
- `create-session-hooks.ts` — session lifecycle hooks
- `create-tool-guard-hooks.ts` — tool budget enforcement
- `create-session-hooks.ts` — largest at 295 LOC
- Only tested indirectly via integration tests

### Recommended Coverage Improvements

1. **Install `@vitest/coverage-v8`** — enables actual coverage metrics
2. **Add `tests/lib/continuity.test.ts`** — test CRUD, normalization, cloning, file I/O
3. **Add `tests/lib/lifecycle-manager.test.ts`** — test state machine, event handling
4. **Add `tests/hooks/` directory** — test each hook factory in isolation
5. **Add `tests/lib/runtime.test.ts`** — test `inferContinuityStatusFromEvent()`

### Test-to-Source Ratio
- Source: ~4,581 LOC across 35 files
- Tests: ~5,565 LOC across 18 test files
- Ratio: **1.21:1** (tests slightly exceed source — healthy)

---

*Testing analysis: 2026-04-21*
