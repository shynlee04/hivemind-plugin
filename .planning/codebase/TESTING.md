# Testing Patterns

**Analysis Date:** 2026-05-15

## Test Framework

**Runner:**
- Vitest 4.1.5
- Config: `vitest.config.ts`

**Assertion Library:**
- Vitest built-in assertions (BDD-style: `expect().toBe()`, `expect().toEqual()`, `expect().toThrow()`)
- Vitest globals enabled — no imports needed for `describe`, `it`, `expect`, `beforeEach`, `afterEach`, `vi`

**Coverage:**
- Provider: `@vitest/coverage-v8` 4.1.5
- Reporter: `text`, `lcov`, `json-summary`
- Thresholds (enforced):
  - Statements: 85%
  - Branches: 72%
  - Functions: 85%
  - Lines: 85%
- Coverage scope: `src/**/*.ts`
- Coverage exclusions: `src/index.ts`, `src/**/index.ts` (barrel files)

**Run Commands:**
```bash
npm test                     # Run all tests (vitest run)
npm run test:watch           # Watch mode (vitest)
npm run test:coverage        # Coverage report with thresholds
npx vitest run tests/lib/helpers.test.ts  # Single test file
npx vitest run -t "unwrapData"            # Tests matching pattern
```

## Test File Organization

**Location:**
- `tests/` directory at project root, mirroring `src/` structure
- `tests/lib/` → `src/` runtime modules (shared, task-management, coordination, features)
- `tests/hooks/` → `src/hooks/` (transforms, observers, guards, composition)
- `tests/schema-kernel/` → `src/schema-kernel/` (Zod schema validation)
- `tests/cli/` → `src/cli/` (CLI commands, discovery, renderer, router)
- `tests/tools/` → `src/tools/` (tool implementations)
- `tests/plugin/` → `src/plugin.ts` (plugin bootstrap, tool registration)
- `tests/sidecar/` → `src/sidecar/` (readonly state sidecar)
- `tests/features/` → `src/features/` (session-tracker, doc-intelligence, etc.)

**Naming:**
- Source file `foo.ts` → test file `foo.test.ts`
- Test directories mirror source subdirectories (e.g., `src/tools/delegation/` → `tests/tools/delegate-task.test.ts`)
- Phase-specific tests use descriptive names (e.g., `CP-ST-03-01-excision.test.ts`)

**Structure:**
```
tests/
├── lib/                          # Runtime module tests (largest group)
│   ├── helpers.test.ts
│   ├── state.test.ts
│   ├── delegation-manager.test.ts
│   ├── concurrency.test.ts
│   ├── security/
│   │   ├── redaction.test.ts
│   │   └── path-scope.test.ts
│   └── ...
├── hooks/                        # Hook tests
│   ├── transforms/
│   ├── observers/
│   └── ...
├── schema-kernel/                # Schema validation tests
├── cli/                          # CLI tests
│   └── commands/
├── tools/                        # Tool implementation tests
├── plugin/                       # Plugin bootstrap tests
├── sidecar/                      # Sidecar tests
└── features/                     # Feature-specific tests
    └── session-tracker/
        ├── capture/
        ├── persistence/
        ├── transform/
        └── recovery/
```

**Test file count:** 165 test files
**Source file count:** 197 source files

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { functionUnderTest } from "../../src/module.js"

describe("ModuleName", () => {
  let instance: ModuleClass

  beforeEach(() => {
    vi.useRealTimers()
    instance = new ModuleClass()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    // Cleanup temp dirs, env vars, etc.
  })

  // Section separators with descriptive comments
  // ---------------------------------------------------------------------------
  // construction
  // ---------------------------------------------------------------------------

  describe("construction", () => {
    it("constructs with empty state", () => {
      expect(instance.getStats("nonexistent")).toBeUndefined()
    })
  })

  // ---------------------------------------------------------------------------
  // dispatch
  // ---------------------------------------------------------------------------

  describe("dispatch", () => {
    it("creates child session with correct title and parentID", async () => {
      const result = await instance.dispatch({ ... })
      expect(result.status).toBe("running")
    })

    it("validates agent name with [Harness] error prefix", async () => {
      await expect(instance.dispatch({ agent: "not-real", ... }))
        .rejects.toThrow('[Harness] Invalid agent: "not-real"')
    })
  })
})
```

**Patterns:**
- One `describe` block per testable unit (class, module, or function group)
- Nested `describe` blocks for logical sections (construction, dispatch, lifecycle, persistence)
- One behavior per `it()` — descriptive lowercase names
- `beforeEach` for setup: create instances, mock SDK calls, set env vars
- `afterEach` for cleanup: restore mocks, reset timers, remove temp directories
- Section separators using `// ---` comments for visual grouping

## Mocking

**Framework:** Vitest `vi` module

**Patterns:**

```typescript
// Module-level mocking (hoisted)
vi.mock("../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
  getSessionMessageCount: vi.fn(),
}))
const mockGetSession = vi.mocked(getSession)

// Spying on module exports
const acquireSpy = vi.spyOn(
  (manager as unknown as { semaphore: { acquire: (...args: unknown[]) => Promise<() => void> } }).semaphore,
  "acquire",
)

// Spying on prototype methods
const idleSpy = vi.spyOn(DelegationManager.prototype, "handleSessionIdle")

// Mock client factory pattern
function createMockClient(): MockClient {
  return {
    session: {
      create: vi.fn().mockResolvedValue({ data: { id: "child-ses-123" } }),
      prompt: vi.fn().mockResolvedValue(undefined),
      promptAsync: vi.fn().mockResolvedValue(undefined),
      status: vi.fn().mockResolvedValue({ data: {} }),
      messages: vi.fn().mockResolvedValue({ data: [...] }),
      abort: vi.fn().mockResolvedValue(undefined),
    },
    app: {
      agents: vi.fn().mockResolvedValue({ data: [...] }),
      log: vi.fn(),
    },
  }
}

// Timer mocking
vi.useFakeTimers()
await vi.advanceTimersByTimeAsync(500)
vi.useRealTimers()

// Restore all mocks in afterEach
vi.restoreAllMocks()
```

**What to Mock:**
- OpenCode SDK client calls (`client.session.create`, `client.session.promptAsync`, etc.)
- External dependencies (`bun-pty`, `@opencode-ai/sdk`)
- Module exports via `vi.mock()` for controlled test doubles
- Environment variables (save/restore pattern in `beforeEach`/`afterEach`)
- File system operations using temp directories (`mkdtempSync`)

**What NOT to Mock:**
- Pure utility functions (test them directly)
- Zod schema validation (test schema behavior, not mock it)
- Internal state managers (use real instances with controlled inputs)

## Fixtures and Factories

**Test Data:**
```typescript
// Factory function for test objects
const makeValidMeta = (rootID: string): DelegationMeta => ({
  rootID,
  depth: 1,
  budgetUsed: 1,
  agent: "builder",
  queueKey: "default",
})

// Mock client factory
function createMockClient(): MockClient { ... }

// Manager factory with options
function createManager(client: MockClient, options?: ManagerOptions): DelegationManager { ... }

// Delegation factory with overrides
function makeDelegation(overrides: Partial<Delegation> = {}): Delegation {
  return {
    id: "del-owned",
    parentSessionId: "ses-parent-owned",
    childSessionId: "ses-child-owned",
    agent: "builder",
    status: "running",
    createdAt: Date.now(),
    // ... defaults
    ...overrides,
  }
}
```

**Location:**
- Factories defined inline in test files (no shared fixtures directory)
- Type definitions for mock objects at top of test file (`MockClient`, `ManagerInternals`, etc.)
- Temp directory pattern: `mkdtempSync(join(tmpdir(), "test-prefix-"))` with cleanup in `afterEach`

## Coverage

**Requirements:**
- Statements: 85%
- Branches: 72%
- Functions: 85%
- Lines: 85%

**View Coverage:**
```bash
npm run test:coverage
```

Coverage reports generated in:
- `coverage/` directory (lcov format)
- `coverage/coverage-summary.json` (json-summary format)

## Test Types

**Unit Tests:**
- Primary test type — all 165 test files are unit tests
- Test individual functions, classes, and modules in isolation
- Mock external dependencies (SDK, file system, timers)
- Examples: `helpers.test.ts`, `state.test.ts`, `concurrency.test.ts`

**Integration Tests:**
- Present in `tests/features/session-tracker/integration/e2e-verification.test.ts`
- Test multi-module interactions (session-tracker capture + persistence + recovery)
- Use `vi.mock()` for SDK layer but test real module interactions
- E2E verification tests validate full session lifecycle flows

**E2E Tests:**
- No dedicated E2E test framework (no Playwright, Cypress, etc.)
- E2E-style tests embedded in unit test files using mock SDK clients
- Plugin lifecycle tests in `tests/plugins/plugin-lifecycle.test.ts`

## Common Patterns

**Async Testing:**
```typescript
it("returns delegation ID immediately with dispatched status", async () => {
  const result = await manager.dispatch({ ... })
  expect(result.status).toBe("running")
  expect(result.delegationId).toBeTypeOf("string")
})

// Concurrent operations
const [one, two] = await Promise.all([
  manager.dispatch({ parentSessionId: "ses-p1", ... }),
  manager.dispatch({ parentSessionId: "ses-p2", ... }),
])
expect(one.delegationId).not.toBe(two.delegationId)
```

**Error Testing:**
```typescript
// Synchronous error
expect(() => unwrapData({ error: "Something went wrong" }))
  .toThrow("[Harness] Something went wrong")

// Async rejection
await expect(manager.dispatch({ agent: "not-real", ... }))
  .rejects.toThrow('[Harness] Invalid agent: "not-real"')

// Regex match on error
expect(() => mgr.reserveDescendant("root-limit", 3))
  .toThrow(/^\[Harness\]/)

// Specific error message content
const delegation = manager.getStatus(result.delegationId)
expect(delegation?.error).toContain("[Harness]")
expect(delegation?.error).toContain("100")
```

**Timer Testing:**
```typescript
it("safety ceiling fires after MAX runtime", async () => {
  vi.useFakeTimers()
  const manager = new DelegationManager(client as never)
  const result = await manager.dispatch({ ..., safetyCeilingMs: 25 })

  await vi.advanceTimersByTimeAsync(24)
  expect(manager.getStatus(result.delegationId)?.status).toBe("running")

  await vi.advanceTimersByTimeAsync(1)
  expect(manager.getStatus(result.delegationId)?.status).toBe("timeout")
  expect(client.session.abort).toHaveBeenCalledWith({ path: { id: "child-safety" } })
})
```

**Environment Variable Testing:**
```typescript
let previousStateDir: string | undefined

beforeEach(() => {
  previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
  stateDir = mkdtempSync(join(tmpdir(), "delegation-manager-"))
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

**Internals Access Pattern:**
```typescript
// Cast to access private fields for testing
function getInternals(manager: DelegationManager): ManagerInternals {
  return manager as unknown as ManagerInternals
}

// Use in tests
expect(getInternals(manager).stabilityTimers.size).toBe(1)
expect(getInternals(manager).delegationsBySession.has("child-orphan")).toBe(false)
```

---

*Testing analysis: 2026-05-15*
