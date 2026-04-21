# Testing Patterns

**Analysis Date:** 2026-04-22

## Test Framework

**Runner:**
- Vitest v1.0.0
- Config: `vitest.config.ts`

**Assertion Library:**
- Vitest built-in (`expect` from vitest)
- Uses `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach` from vitest globals

**Run Commands:**
```bash
npm test              # Run all tests (vitest run)
npm run test:watch    # Watch mode (vitest)
npm run test:coverage # Coverage report (vitest run --coverage)
npx vitest run tests/lib/helpers.test.ts    # Run single test file
npx vitest run -t "dispatch"                # Run tests matching pattern
```

**Coverage Configuration:**
- Includes: `src/**/*.ts`
- Excludes: `src/index.ts`, `src/**/index.ts` (barrel files)
- Reporters: `text`, `lcov`
- No minimum coverage threshold enforced

## Test File Organization

**Location:**
- Tests mirror source directory structure under `tests/`:
  - `src/lib/*.ts` → `tests/lib/*.test.ts`
  - `src/tools/*.ts` → `tests/tools/*.test.ts`
  - `src/lib/spawner/*.ts` → `tests/lib/spawner/*.test.ts`
  - `src/lib/pty/*.ts` → `tests/lib/pty/*.test.ts`
  - `src/plugins/*.ts` → `tests/plugins/*.test.ts`
  - `src/schema-kernel/*.ts` → `tests/schema-kernel/*.test.ts`
  - Integration tests: `tests/integration/*.test.ts`

**Naming:**
- `{module-name}.test.ts` — kebab-case with `.test.ts` suffix
- Test helper files: `tests/lib/helpers/in-memory-client.ts` (no `.test.` suffix)

**Structure:**
```
tests/
├── lib/                    # Unit tests for src/lib/
│   ├── helpers/            # Test helpers
│   │   └── in-memory-client.ts
│   ├── spawner/            # Spawner sub-module tests
│   └── pty/                # PTY sub-module tests
├── tools/                  # Unit tests for src/tools/
├── plugins/                # Plugin-level tests
├── schema-kernel/          # Zod schema tests
└── integration/            # Cross-module integration tests
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { DelegationManager } from "../../src/lib/delegation-manager.js"

describe("DelegationManager", () => {
  let stateDir: string
  let previousStateDir: string | undefined

  beforeEach(() => {
    vi.useRealTimers()
    previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
    stateDir = mkdtempSync(join(tmpdir(), "delegation-manager-"))
    process.env.OPENCODE_HARNESS_STATE_DIR = stateDir
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    if (previousStateDir === undefined) {
      delete process.env.OPENCODE_HARNESS_STATE_DIR
    } else {
      process.env.OPENCODE_HARNESS_STATE_DIR = previousStateDir
    }
    rmSync(stateDir, { recursive: true, force: true })
  })

  describe("dispatch", () => {
    it("creates child session with correct title and parentID", async () => {
      // ...
    })
  })

  describe("dual-signal completion", () => {
    it("completes delegation after STABILITY_THRESHOLD stable polls", async () => {
      // ...
    })
  })
})
```

**Patterns:**
- Nested `describe` blocks for logical groupings (e.g., `dispatch`, `dual-signal completion`, `persistence`, `recovery`)
- `beforeEach`/`afterEach` for setup and cleanup
- Environment variable save/restore pattern for `OPENCODE_HARNESS_STATE_DIR`
- Temp directories via `mkdtempSync(join(tmpdir(), "prefix-"))` with cleanup in `afterEach`

## Mocking

**Framework:** Vitest `vi` module

**Patterns:**
```typescript
// Mock client with vi.fn()
type MockClient = {
  session: {
    create: ReturnType<typeof vi.fn>
    prompt: ReturnType<typeof vi.fn>
    status: ReturnType<typeof vi.fn>
    messages: ReturnType<typeof vi.fn>
    abort: ReturnType<typeof vi.fn>
  }
  app: {
    agents: ReturnType<typeof vi.fn>
  }
}

function createMockClient(): MockClient {
  return {
    session: {
      create: vi.fn().mockResolvedValue({ data: { id: "child-ses-123" } }),
      prompt: vi.fn().mockResolvedValue(undefined),
      status: vi.fn().mockResolvedValue({ data: {} }),
      messages: vi.fn().mockResolvedValue({
        data: [
          { role: "user", parts: [{ type: "text", text: "task" }] },
          { role: "assistant", parts: [{ type: "text", text: "Task completed" }] },
        ],
      }),
      abort: vi.fn().mockResolvedValue(undefined),
    },
    app: {
      agents: vi.fn().mockResolvedValue({
        data: [
          { name: "researcher" },
          { name: "builder" },
          { name: "critic" },
        ],
      }),
    },
  }
}

// Spy on module functions
const acquireSpy = vi.spyOn(manager.semaphore, "acquire")
vi.spyOn(sessionApi, "getSessionMessageCount").mockResolvedValue(0)

// Spy on prototype methods
vi.spyOn(DelegationManager.prototype, "handleSessionIdle")

// Namespace import for module-level spying
import * as sessionApi from "../../src/lib/session-api.js"
import * as spawnerConcurrencyKey from "../../src/lib/spawner/concurrency-key.js"
```

**What to Mock:**
- OpenCode SDK client (`session.*`, `app.*`) — never hit real API
- File system via temp directories (real fs, isolated paths)
- Environment variables (save/restore pattern)
- Module functions via `vi.spyOn` for cross-module dependencies
- Time via `vi.useFakeTimers()` / `vi.advanceTimersByTimeAsync()`

**What NOT to Mock:**
- Pure utility functions (tested directly)
- Type guards and transition logic (tested as-is)
- Zod schemas (tested with real data)

## Fixtures and Factories

**Test Data:**
```typescript
// Factory function for Delegation objects
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
    executionMode: "headless",
    workingDirectory: process.cwd(),
    queueKey: "agent:builder",
    ...overrides,
  }
}

// Stub manager with vi.fn() methods
type ManagerStub = {
  getStatus: ReturnType<typeof vi.fn>
  getAllDelegations: ReturnType<typeof vi.fn>
}

function createManagerStub(delegations: Delegation[] = []): ManagerStub {
  const byId = new Map(delegations.map(d => [d.id, d]))
  return {
    getStatus: vi.fn((id: string) => byId.get(id)),
    getAllDelegations: vi.fn(() => delegations),
  }
}

// In-memory client for integration tests
function createInMemoryClient(): InMemoryClient {
  // Full fake client with _sessions Map, _setStatus, _addMessage helpers
}
```

**Location:**
- `tests/lib/helpers/in-memory-client.ts` — reusable fake OpenCode client
- Inline factories in test files (`createMockClient`, `makeDelegation`, `createManagerStub`)

## Coverage

**Requirements:** None enforced — no minimum threshold in config

**View Coverage:**
```bash
npm run test:coverage
```

**Coverage excludes:** `src/index.ts`, `src/**/index.ts` (barrel files)

## Test Types

**Unit Tests:**
- Primary test type — all `tests/lib/` and `tests/tools/` files
- Test individual modules, classes, and functions in isolation
- Mock external dependencies (SDK, file system, timers)
- Examples: `tests/lib/helpers.test.ts` (505 lines), `tests/lib/concurrency.test.ts` (432 lines), `tests/lib/delegation-manager.test.ts` (1400+ lines)

**Integration Tests:**
- Located in `tests/integration/`
- Test cross-module interactions and schema contracts
- Example: `tests/integration/prompt-enhance-pipeline.test.ts` — validates schema consistency across tools, hook behavior, full pipeline execution
- Use real tool factories with mocked context

**E2E Tests:**
- Not used — no Playwright or browser-based testing

## Common Patterns

**Async Testing:**
```typescript
// Promise-based async with await
it("resolves with idle when session.idle is fed", async () => {
  const resultPromise = detector.watch("ses_1", 5000)
  detector.feed("session.idle", "ses_1")
  await expect(resultPromise).resolves.toEqual({
    signal: "idle",
    sessionID: "ses_1",
  })
})

// Fake timers for time-dependent behavior
vi.useFakeTimers()
await vi.advanceTimersByTimeAsync(STABILITY_POLL_INTERVAL_MS * STABILITY_THRESHOLD)
vi.useRealTimers()  // in afterEach

// Microtask flushing
async function flushMicrotasks(): Promise<void> {
  await Promise.resolve()
}

// Concurrent dispatch testing
const [one, two] = await Promise.all([
  manager.dispatch({ parentSessionId: "ses-p1", agent: "builder", prompt: "one" }),
  manager.dispatch({ parentSessionId: "ses-p2", agent: "builder", prompt: "two" }),
])
```

**Error Testing:**
```typescript
// Thrown errors with message matching
await expect(manager.dispatch({
  parentSessionId: "ses-parent-1",
  agent: "not-real",
  prompt: "do work",
})).rejects.toThrow('[Harness] Invalid agent: "not-real"')

// Regex matching for [Harness] prefix
expect(() => reserveSubagentSpawn("parent-over", "root-limit", mgr)).toThrow(/^\[Harness\]/)

// Timeout rejection
await expect(queue.acquire("timeout-key", 1, 50)).rejects.toThrow(/\[Harness\].*timed out/)

// Graceful handling (no throw)
await expect(manager.recoverPending()).resolves.toBeUndefined()
```

**State Isolation:**
```typescript
// Fresh instance per test
let mgr: TaskStateManager
beforeEach(() => { mgr = new TaskStateManager() })

// Environment variable save/restore
let previousStateDir: string | undefined
beforeEach(() => {
  previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
  stateDir = mkdtempSync(join(tmpdir(), "prefix-"))
  process.env.OPENCODE_HARNESS_STATE_DIR = stateDir
})
afterEach(() => {
  vi.restoreAllMocks()
  if (previousStateDir === undefined) {
    delete process.env.OPENCODE_HARNESS_STATE_DIR
  } else {
    process.env.OPENCODE_HARNESS_STATE_DIR = previousStateDir
  }
  rmSync(stateDir, { recursive: true, force: true })
})
```

**Internal Access for Testing:**
```typescript
// Type casting to access private members
function getInternals(manager: DelegationManager): ManagerInternals {
  return manager as unknown as ManagerInternals
}

// Constructor casting for mock injection
function createManager(client: MockClient, options?: ManagerOptions): DelegationManager {
  const DelegationManagerCtor = DelegationManager as unknown as new (
    client: MockClient,
    options?: ManagerOptions,
  ) => DelegationManager
  return new DelegationManagerCtor(client, options)
}

// @internal getter on class
get stabilityTimers(): Map<string, NodeJS.Timeout> {
  return this.sdkHandler.getTimerMap()
}
```

**Dynamic imports for isolated module testing:**
```typescript
// Used in task-status.test.ts to avoid shared state
const { VALID_TRANSITIONS } = await import("../../src/lib/task-status.js")
```

## Test File Inventory

| Test File | Lines | What It Tests |
|-----------|-------|---------------|
| `tests/lib/delegation-manager.test.ts` | 1400+ | DelegationManager: dispatch, completion, lifecycle, persistence, recovery |
| `tests/lib/helpers.test.ts` | 505 | Pure utilities: isObject, getNestedValue, unwrapData, stableStringify, buildPromptText |
| `tests/lib/concurrency.test.ts` | 432 | DelegationConcurrencyQueue, buildDelegationQueueKey, SpawnReservation |
| `tests/lib/completion-detector.test.ts` | 326 | CompletionDetector: feed/watch, cache, timeout, cancel, stability |
| `tests/lib/completion-detector-crash.test.ts` | — | Crash resilience scenarios |
| `tests/tools/delegate-task.test.ts` | 339 | delegate-task tool: plugin registration, routing, error handling |
| `tests/tools/delegation-status.test.ts` | 313 | delegation-status tool: lookup, filtering, listing |
| `tests/tools/run-background-command.test.ts` | — | Background command tool |
| `tests/tools/session-patch.test.ts` | — | Session patch tool |
| `tests/tools/prompt-skim.test.ts` | — | Prompt skim tool |
| `tests/tools/prompt-analyze.test.ts` | — | Prompt analyze tool |
| `tests/lib/state.test.ts` | 207 | TaskStateManager: stats, budgets, delegation meta, subagent registry |
| `tests/lib/task-status.test.ts` | 199 | Task status transitions and guards |
| `tests/lib/notification-handler.test.ts` | — | Notification handler |
| `tests/lib/runtime-policy.test.ts` | — | Runtime policy loading |
| `tests/lib/helpers/in-memory-client.ts` | 58 | Test helper: fake OpenCode client |
| `tests/integration/prompt-enhance-pipeline.test.ts` | 250 | E2E: schema contracts, hook behavior, tool registration |
| `tests/plugins/plugin-lifecycle.test.ts` | — | Plugin lifecycle |
| `tests/plugins/prompt-enhance-compaction.test.ts` | — | Prompt enhance compaction |
| `tests/schema-kernel/prompt-enhance.schema.test.ts` | — | Zod schema validation |
| `tests/lib/spawner/*.test.ts` | — | Spawner sub-module tests |
| `tests/lib/pty/*.test.ts` | — | PTY sub-module tests |

---

*Testing analysis: 2026-04-22*
