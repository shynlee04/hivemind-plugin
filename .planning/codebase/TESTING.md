<!-- generated-by: gsd-doc-writer -->
# Testing Patterns

**Analysis Date:** 2026-04-28
**Updated:** 2026-05-06

## Test Framework

**Runner:**
- Vitest 4.1.5
- Config: `vitest.config.ts` at project root

**Assertion Library:**
- Vitest's built-in `expect` (globals enabled — no imports needed for `describe`, `it`, `expect`)

**Run Commands:**
```bash
npm test                    # Run all tests (vitest run)
npm run test:watch          # Watch mode (vitest)
npm run test:coverage       # Coverage report (vitest run --coverage)
npx vitest run path/to/file # Run single test file
npx vitest run -t "pattern" # Run tests matching pattern
```

## Test File Organization

**Location:**
- Tests live in `tests/` directory at project root, mirroring `src/` structure
- `tests/lib/` → mirrors `src/lib/`
- `tests/tools/` → mirrors `src/tools/`
- `tests/hooks/` → mirrors `src/hooks/`
- `tests/schema-kernel/` → mirrors `src/schema-kernel/`
- `tests/integration/` → cross-module integration tests
- `eval/` → separate directory for quality metrics (coherence, correctness, stability)
- Integration tests and eval tests are both included in vitest `include` glob: `['tests/**/*.test.ts', 'eval/**/*.test.ts']`

**Naming:**
- Test files named `{source-module}.test.ts` — exact mirror of source filename
- Example: `src/lib/concurrency.ts` → `tests/lib/concurrency.test.ts`
- Special variants append descriptors: `completion-detector-crash.test.ts` for crash-specific scenarios

**Structure:**
```
tests/
├── lib/
│   ├── helpers.test.ts            # Mirrors src/lib/helpers.ts
│   ├── concurrency.test.ts        # Mirrors src/lib/concurrency.ts
│   ├── continuity.test.ts         # Mirrors src/lib/continuity.ts
│   ├── state.test.ts              # Mirrors src/lib/state.ts
│   ├── task-status.test.ts        # Mirrors src/lib/task-status.ts
│   ├── completion-detector.test.ts
│   ├── completion-detector-crash.test.ts  # Specialized gap-documentation variant
│   ├── helpers/
│   │   └── in-memory-client.ts    # Test helper utilities
│   ├── config-workflow/           # Sub-module tests
│   │   ├── workflow-e2e.test.ts
│   │   ├── workflow-guards.test.ts
│   │   ├── workflow-persistence.test.ts
│   │   ├── workflow-regression.test.ts
│   │   └── workflow-state.test.ts
│   ├── event-tracker/             # Sub-module tests
│   ├── pty/                       # Sub-module tests
│   ├── security/                  # Sub-module tests
│   └── spawner/                   # Sub-module tests
├── tools/
│   ├── delegate-task.test.ts
│   ├── delegation-status.test.ts
│   ├── configure-primitive.test.ts
│   ├── prompt-skim.test.ts
│   ├── prompt-analyze.test.ts
│   ├── session-patch.test.ts
│   ├── run-background-command.test.ts
│   ├── session-journal-export.test.ts
│   └── validate-restart.test.ts
├── hooks/
│   ├── create-core-hooks.test.ts
│   ├── create-session-hooks.test.ts
│   ├── create-tool-guard-hooks.test.ts
│   ├── hook-cqrs-boundary.test.ts
│   ├── plugin-event-observers.test.ts
│   └── tool-after-composer.test.ts
├── schema-kernel/
│   ├── opencode-config.schemas.test.ts
│   └── prompt-enhance.schema.test.ts
├── plugins/
│   └── plugin-lifecycle.test.ts
└── integration/
    └── prompt-enhance-pipeline.test.ts
eval/
├── coherence.test.ts
├── correctness.test.ts
└── stability.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect } from "vitest"
// Some tests also import vi for mocking/fake timers

describe("SubjectUnderTest", () => {
  let instance: SubjectType

  beforeEach(() => {
    instance = new SubjectType()
  })

  describe("feature area", () => {
    it("describes expected behavior in plain English", () => {
      // Arrange
      const input = ...
      // Act
      const result = instance.method(input)
      // Assert
      expect(result).toBe(expected)
    })
  })
})
```

**Patterns:**
- **Setup:** `beforeEach` for fresh instances, mock environment variables, temp directories
- **Teardown:** `afterEach` for `vi.restoreAllMocks()`, `vi.resetModules()`, env var cleanup, temp directory removal with `rmSync(dir, { recursive: true, force: true })`
- **Assertion:** `expect(value).toBe(...)` for primitives, `expect(value).toEqual(...)` for objects/arrays, `expect(value).toMatchObject(...)` for partial matching, `expect(value).toThrow(/pattern/)` for errors, `await expect(promise).resolves.toEqual(...)` for async resolution

**Real example from `tests/lib/task-status.test.ts`:**
```typescript
describe("canTransition", () => {
  it("should allow pending -> queued", async () => {
    const { canTransition } = await import("../../src/lib/task-status.js")
    expect(canTransition("pending", "queued")).toBe(true)
  })

  it("should reject completed -> pending", async () => {
    const { canTransition } = await import("../../src/lib/task-status.js")
    expect(canTransition("completed", "pending")).toBe(false)
  })
})
```

**Two import patterns observed:**
1. **Static imports** (most common): `import { DelegateTaskInputSchema } from "../../src/tools/delegate-task.js"`
2. **Dynamic imports** (used when module has side effects, e.g., module-level singleton or env-dependent): `const { canTransition } = await import("../../src/lib/task-status.js")` — often paired with `vi.resetModules()` in `beforeEach` for isolation

## Mocking

**Framework:** Vitest's built-in `vi` mocking utilities

**Patterns:**

**1. Function mocks with `vi.fn()`:**
```typescript
// From tests/hooks/create-core-hooks.test.ts
function createFakeLifecycleManager() {
  return {
    handleEvent: vi.fn(),
    replayPendingNotificationsForEvent: vi.fn(),
  }
}

it("routes events correctly", async () => {
  const lm = createFakeLifecycleManager()
  const hooks = createCoreHooks({ lifecycleManager: lm as never } as never)
  await hooks.event({ event: { type: "session.created", sessionID: "ses_test" } })
  expect(lm.handleEvent).toHaveBeenCalledWith({
    event: expect.objectContaining({ type: "session.created" }),
    eventType: "session.created",
    sessionID: "ses_test",
  })
})
```

**2. Module mocking with `vi.mock()`:**
```typescript
// From tests/lib/pty/pty-manager.test.ts
vi.mock("bun-pty", () => ({
  spawn: vi.fn((_command, _args, _options) => {
    // Return mock PTY with controllable listeners
    currentPty = {
      pid: 4242,
      write: vi.fn(),
      kill: vi.fn(),
      onData: vi.fn((listener) => { dataListener = listener; return { dispose: vi.fn() } }),
      onExit: vi.fn((listener) => { exitListener = listener; return { dispose: vi.fn() } }),
    }
    return currentPty
  }),
}))
```

**3. Partial module mocking with `vi.doMock()`:**
```typescript
// From tests/lib/continuity.test.ts
vi.doMock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs")
  return {
    ...actual,
    writeFileSync: vi.fn<typeof actual.writeFileSync>((...args) => {
      // Intercept writes for assertion
      actual.writeFileSync(...args)
    }),
  }
})
```

**4. Fake timers with `vi.useFakeTimers()`:**
```typescript
// From tests/lib/completion-detector-crash.test.ts
describe("crash detection", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    detector = new CompletionDetector(200)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("stability timer resolves when messages stop", async () => {
    const resultPromise = detector.watch("stale-session", 5000)
    detector.feedMessageCount("stale-session", 3)
    vi.advanceTimersByTime(250)
    const result = await resultPromise
    expect(result.signal).toBe("idle")
  })
})
```

**5. Spying on prototype methods:**
```typescript
// From tests/tools/delegate-task.test.ts
const idleSpy = vi.spyOn(DelegationManager.prototype, "handleSessionIdle")
```

**What to Mock:**
- External platform modules (`bun-pty`, `@opencode-ai/plugin`, `@opencode-ai/sdk`)
- File system operations in persistence tests (use `vi.doMock("node:fs", ...)`)
- `process.env` with `beforeEach`/`afterEach` cleanup
- SDK client methods (`session.messages`, `session.status`, `session.prompt`)

**What NOT to Mock:**
- Pure library functions (`helpers.ts` tests use zero mocking)
- Schema validation (tested with real Zod schemas and `safeParse`)
- Tool execute functions in integration tests (use real tool instances with mock context)
- `TaskStateManager` — instantiated directly, no mocking

## Fixtures and Factories

**Test Data:**
- Small inline factories for creating test records:
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
```

- Helper functions for creating mock client/callback objects:
```typescript
// From tests/lib/sdk-delegation.test.ts
function createMockClient(): MockClient {
  return {
    session: {
      messages: vi.fn().mockResolvedValue({ data: [...] }),
      status: vi.fn().mockResolvedValue({ data: {} }),
      prompt: vi.fn().mockResolvedValue(undefined),
    },
  }
}
```

**Location:**
- Inline in test files (no separate fixtures directory)
- Shared test helpers in `tests/lib/helpers/in-memory-client.ts`

## Coverage

**Requirements:**
- Thresholds enforced in `vitest.config.ts`:
  - Statements: 70%
  - Branches: 60%
  - Functions: 70%
  - Lines: 70%
- Coverage provider: v8
- Coverage includes: `src/**/*.ts`
- Excluded: `src/index.ts` (pure re-export barrel), `src/**/index.ts`

**View Coverage:**
```bash
npm run test:coverage        # Text + lcov report
```

## Test Types

**Unit Tests:**
- Scope: Individual functions, classes, constants
- Location: `tests/lib/`, `tests/tools/`, `tests/hooks/`
- Approach: White-box testing of boundary conditions, error paths, state transitions
- Heavy use of fake timers for time-dependent logic (`CompletionDetector`, `DelegationConcurrencyQueue`)
- Heavy use of dynamic imports + `vi.resetModules()` for modules with side effects

**Integration Tests:**
- Scope: Cross-module pipelines, tool-to-schema validation, plugin lifecycle
- Location: `tests/integration/`, `tests/plugins/`
- Approach: Real tool instances tested with mock context objects, real schema validation
- Example: `prompt-enhance-pipeline.test.ts` tests the full skim→analyze→patch pipeline with Zod schema validation

**E2E Tests:**
- Framework: Not used (no Playwright/Cypress/Selenium)
- Workflow simulation tests in `tests/lib/config-workflow/workflow-e2e.test.ts` test the full 8-turn configuration state machine with real module imports and temp file I/O

**Eval Tests:**
- Special category in `eval/` directory — quality metrics, not pass/fail
- `coherence.test.ts` — measures ecosystem coherence (agent description overlap, permission conflicts)
- `correctness.test.ts` — round-trip fidelity of compile/decompile operations
- `stability.test.ts` — stress tests (100+ primitives, concurrent compilations, large inputs)

## Common Patterns

**Async Testing:**
```typescript
// Promise resolution
await expect(resultPromise).resolves.toEqual({ signal: "idle", sessionID: "ses_1" })

// Rejection testing
await expect(queue.acquire("key", 1, 50)).rejects.toThrow(/\[Harness\].*timed out/)

// Sequential execution order
const order: number[] = []
const p2 = queue.acquire("key", 1).then((rel) => { order.push(2); rel() })
order.push(1)
r1()
await p2
expect(order).toEqual([1, 2])
```

**Error Testing:**
```typescript
// Thrown errors have [Harness] prefix
expect(() => unwrapData({ error: "Something went wrong" })).toThrow("[Harness] Something went wrong")
expect(() => mgr.reserveDescendant("root-limit", 3)).toThrow(/^\[Harness\]/)

// Tool errors return envelope, don't throw
const result = JSON.parse(await tool.execute({ ... }, ctx))
expect(result.kind).toBe("error")
```

**Temporary directory isolation:**
```typescript
// From tests/lib/continuity.test.ts
let stateDir: string
beforeEach(() => {
  stateDir = mkdtempSync(join(tmpdir(), "continuity-test-"))
  process.env.OPENCODE_HARNESS_STATE_DIR = stateDir
})
afterEach(() => {
  rmSync(stateDir, { recursive: true, force: true })
})
```

**Environment variable manipulation with cleanup:**
```typescript
let previousStateDir: string | undefined
beforeEach(() => {
  previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
})
afterEach(() => {
  if (previousStateDir === undefined) {
    delete process.env.OPENCODE_HARNESS_STATE_DIR
  } else {
    process.env.OPENCODE_HARNESS_STATE_DIR = previousStateDir
  }
})
```

**Module isolation for singleton-dependent tests:**
```typescript
beforeEach(() => {
  vi.resetModules()    // Clears module cache so each test gets fresh imports
  vi.unmock("node:fs") // Reset any previous mocks
})
```

---

## Current Test Status (2026-05-06)

| Metric | Value |
|--------|-------|
| Test files | 120 (119 passing, 1 failed) |
| Individual tests | 1,606 (1,604 passing, 2 failing) |
| Failing tests | 2 in `tests/lib/session-journal.test.ts` (category ownership assertions — `.hivemind/` README format mismatch) |
| Failing file | `tests/lib/session-journal.test.ts` |
| Coverage thresholds | Statements: 70%, Branches: 60%, Functions: 70%, Lines: 70% |
| Test framework | Vitest 4.1.5 with v8 coverage provider |
| Known warnings | `vi.unmock("node:fs")` not at top level in `continuity.test.ts` and `delegation-persistence.test.ts` (will become errors in future vitest) |

---

*Testing analysis: 2026-04-28 — updated 2026-05-06 (test counts, failing tests, coverage verification)*
