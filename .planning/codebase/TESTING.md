# Testing Patterns

**Analysis Date:** 2026-06-06

## Test Framework

**Runner:**
- **Vitest 4.1.7** (`vitest: ^4.1.7` in `package.json` devDependencies)
- Config: `vitest.config.ts` at project root
- Globals enabled (`describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach` available without imports), though most files explicitly `import { describe, it, expect, vi } from "vitest"`
- Setup file: `vitest.setup.ts` (6 lines) — allocates a temp dir and sets `OPENCODE_HARNESS_STATE_DIR` to a unique `vitest-state-XXXX` path under `os.tmpdir()`

**Assertion Library:**
- Vitest built-in `expect` (no chai/jest-circus)
- Matchers used: `toBe`, `toEqual`, `toMatchObject`, `toBeInstanceOf`, `toHaveBeenCalled`, `toHaveBeenCalledWith`, `toBeTypeOf`, `toBeUndefined`, `not.toThrow`, `resolves.toBeUndefined`, `rejects.toThrow`

**Run Commands:**
```bash
npm test                              # Run all tests (vitest run)
npm run test:watch                    # Watch mode (vitest)
npm run test:coverage                 # Coverage report (vitest run --coverage)
npm run typecheck                     # tsc --noEmit (no tests, but runs in pre-merge)
npx vitest run tests/lib/runtime.test.ts      # Single file
npx vitest run -t "behavior name"             # Pattern filter
```

## Test File Organization

**Location:**
- Separate `tests/` directory at project root (NOT co-located with `src/`)
- Mirror of `src/` module structure: `src/shared/runtime.ts` → `tests/lib/runtime.test.ts`
- Sub-directories: `tests/lib/`, `tests/tools/`, `tests/hooks/`, `tests/shared/`, `tests/schema-kernel/`, `tests/sidecar/`, `tests/task-management/`, `tests/coordination/`, `tests/features/`, `tests/cli/`
- Some legacy tests still live in `tests/lib/` (e.g., `tests/lib/runtime.test.ts`, `tests/lib/framework-detector.test.ts`)

**Naming:**
- Standard: `*.test.ts` (e.g., `delegate-task-v2.test.ts`, `contract-enforcement.test.ts`)
- Versioned: `*-v2.test.ts` for second-generation tool tests (e.g., `delegation-status-v2.test.ts`, `delegate-task-v2.test.ts`)
- E2E tests: `*.e2e.test.ts` (e.g., `delegate-task-e2e.test.ts`)
- Capability tests: `*.capability.test.ts` (e.g., `tool-guard-hooks.capability.test.ts`)

**Structure (top-level layout):**
```
tests/
├── lib/                          # Legacy grouping for moved runtime modules
│   ├── helpers/in-memory-client.ts
│   ├── runtime.test.ts
│   ├── control-plane/gatekeeper.test.ts
│   ├── task-management/
│   ├── prompt-packet/
│   └── sdk-supervisor/
├── tools/                        # Tool-focused unit tests
│   ├── delegation/
│   ├── hivemind/
│   ├── execute-slash-command.test.ts
│   ├── prompt-skim.test.ts
│   └── ...
├── hooks/                        # Hook tests (mirrors src/hooks/)
│   ├── transforms/
│   ├── observers/
│   ├── guards/
│   ├── lifecycle/
│   └── composition/
├── shared/                       # Tests for src/shared/ (no .lib. prefix)
│   ├── session-naming.test.ts
│   └── commands-errors.test.ts
├── schema-kernel/                # Zod schema tests
├── sidecar/                      # Sidecar server tests
├── coordination/                 # Coordination module tests
├── features/                     # Feature tests (session-tracker, governance, etc.)
├── cli/                          # CLI tests
└── task-management/              # Continuity, trajectory, etc.
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

describe("ModuleName", () => {
  describe("functionName or sub-feature", () => {
    it("should do something specific", () => {
      // arrange
      const input = createTestInput()
      // act
      const result = functionUnderTest(input)
      // assert
      expect(result).toEqual(expectedOutput)
    })
  })
})
```

**Real pattern from `tests/lib/runtime.test.ts:4-12`:**
```typescript
describe("inferContinuityStatusFromEvent", () => {
  // Test 1: session.created → "pending"
  it('returns "pending" for session.created events', () => {
    const result = inferContinuityStatusFromEvent({
      event: { type: "session.created" },
      eventType: "session.created",
    })
    expect(result).toBe("pending")
  })
  // ... 12 numbered cases
})
```

**Patterns:**
- Top-level `describe` typically names the exported function or module
- Numeric comments (`// Test 1: ...`) used in some suites to map cases to requirements
- `beforeEach` to reset mocks: `beforeEach(() => { vi.clearAllMocks() })`
- `afterEach` to clean up temp dirs: `afterEach(async () => { await fs.rm(tmpDir, { recursive: true, force: true }) })`
- Tests favor explicit arrange/act/assert without the AAA comments (comments are reserved for non-obvious setups)
- One assertion focus per test, but multiple `expect()` calls in one `it()` are accepted

## Mocking

**Framework:**
- Vitest built-in mocking: `vi.mock()`, `vi.fn()`, `vi.spyOn()`, `vi.clearAllMocks()`, `vi.mocked()`
- Module mocks declared at the top of the test file (hoisted by Vitest)
- Time mocking: `vi.useFakeTimers()` / `vi.useRealTimers()`

**Patterns:**

*Module mocking at top of file:*
```typescript
import { vi } from "vitest"
vi.mock("../../../src/shared/session-api.js", () => ({
  createSession: vi.fn(async () => ({ data: { id: "ses_x" } })),
}))
```

*Function mocking:*
```typescript
const coordinator = {
  dispatch: vi.fn().mockResolvedValue({
    delegationId: "dt-123",
    queueKey: "agent:builder",
    status: "dispatched",
  }),
}
```

*Mock factory helper pattern:*
```typescript
function createCoordinator() {
  return {
    dispatch: vi.fn().mockResolvedValue({ delegationId: "dt-123", ... }),
  }
}
// Used in each test
const coordinator = createCoordinator()
const tool = createDelegateTaskTool(coordinator as never)
```

*Dependency factory with overrides:*
```typescript
function createDeps(overrides?: Partial<SessionTrackerConsumerDeps>): SessionTrackerConsumerDeps {
  return {
    sessionTracker: { handleSessionEvent: vi.fn() },
    ...overrides,
  }
}
```

*Mock reset:*
```typescript
beforeEach(() => {
  vi.clearAllMocks()
})
```

**What to Mock:**
- **External dependencies**: `node:fs`, `node:child_process`, `node:fs/promises`, `bun-pty`, `node:os` (e.g., `vi.mock("node:child_process", ...)`)
- **OpenCode SDK wrapper**: `src/shared/session-api.js` is mocked in ~30+ test files because it owns the SDK boundary (e.g., `vi.mock("../../../src/shared/session-api.js", ...)`)
- **File system operations** for state persistence tests (e.g., `vi.mock("node:fs/promises", ...)`)
- **Internal modules** when isolating a unit: `vi.mock("../../src/coordination/completion/notification-handler.js", ...)`

**What NOT to Mock:**
- Pure utility functions from `src/shared/helpers.ts` (`asString`, `getNestedValue`, `unwrapData`, `extractAssistantText`)
- Type guards and small discriminators
- Zod schemas (use `Schema.parse()` directly in tests)
- The system under test (always pass real instances to the unit being tested)

**Mock Helpers:**
- `tests/lib/helpers/in-memory-client.ts` — `createInMemoryClient()` returns a full fake `OpenCodeClient` with `vi.fn()` implementations of `session.get/create/messages/status/prompt/promptAsync/abort` and `tui.showToast`. This is the canonical replacement for the real SDK in delegation/coordination tests.

## Fixtures and Factories

**Test Data:**
- Inline factory functions in test files (no separate `tests/fixtures/` directory)
- Type-annotated factories: `function createDeps(overrides?: Partial<FooDeps>): FooDeps`
- Constants for static fixtures: `const mockAgentContract: AgentWorkContract = { ... }` (see `tests/hooks/contract-enforcement.test.ts:7-32`)
- Mock `OpenCodeClient` instances built ad hoc per file: `const client = { app: { agents: vi.fn(...), log: vi.fn(...) }, session: { create: vi.fn(...), promptAsync: vi.fn(...) } }`

**Location:**
- Inline in test file, scoped to the test
- Shared helpers in `tests/lib/helpers/in-memory-client.ts` (the only shared mock helper)
- No central `tests/fixtures/` directory — fixtures live with the test that uses them

**Tool Response Parsing Pattern (used across tool tests):**
```typescript
function parse(raw: string): Record<string, unknown> {
  return JSON.parse(raw) as Record<string, unknown>
}

const raw = await tool.execute(args, ctx)
const result = parse(raw)
expect(result.kind).toBe("success")
expect(result.data).toMatchObject({ ... })
```

## Coverage

**Requirements:**
- **Provider**: v8 (built into Vitest)
- **Includes**: `src/**/*.ts`
- **Excludes**: `src/index.ts`, `src/**/index.ts` (barrel files have no executable code)
- **Reporters**: `text` (console), `lcov` (HTML), `json-summary` (machine-readable; added Phase 48.4.1 for CI automation)
- **Thresholds** (enforced by `vitest.config.ts`):
  - statements: **75**
  - branches: **62**
  - functions: **80**
  - lines: **77**
  - Comment in config notes: floor sits ~5pp below actual to absorb normal churn. Re-raise as coverage climbs; never lower without audit amendment.
- **History**: raised across multiple phases (P39-04 audit 2026-05-30 set current floor; raised from 70/60/70/70 → 85/72/85/85 → 90/80/90/90 then adjusted to 75/62/80/77 after coverage measurement)

**View Coverage:**
```bash
npm run test:coverage
open coverage/lcov-report/index.html   # HTML report
cat coverage/coverage-summary.json      # JSON for CI parsing
```

## Test Types

**Unit Tests:**
- Scope: single function/class in isolation
- Mocking: external dependencies and SDK boundary mocked
- Speed: <100ms per test (most complete in <10ms)
- Location: `tests/shared/`, `tests/coordination/`, `tests/schema-kernel/`, `tests/lib/` (e.g., `tests/shared/commands-errors.test.ts`)

**Integration Tests (module-level):**
- Scope: multiple modules together via factory wiring
- Mocking: SDK boundary mocked, internal modules real
- Example: `tests/tools/delegation/delegate-task-v2.test.ts` — uses real `createDelegateTaskTool` factory and a mock coordinator

**E2E Tests (plugin-wired):**
- Scope: full delegation flow through `setupDelegationModules()` from `src/plugin.ts`
- Mocking: only the SDK client and `persistDelegations`; real coordinator, lifecycle, manager
- Example: `tests/tools/delegation/delegate-task-e2e.test.ts:23-72`
- Verifies `client.session.create`, `client.session.promptAsync`, and the resulting `delegationManager.listDelegations()`

**Hook Tests:**
- Scope: factory function with mock deps
- Mocking: `SessionTrackerConsumerDeps`, `HookDependencies`, etc., are typed interfaces
- Example: `tests/hooks/observers/session-tracker-consumer.test.ts` — uses `mockHandleSessionEvent` typed via `vi.fn<[input: { eventType: string; sessionID: string; event: unknown }], Promise<void>>()`

**Coverage for TDD Discipline:**
- Tests should pass `npm run typecheck` and `npm test` from a clean state before PR
- See `.opencode/rules/universal-rules.md` for the binding test-first cycle (RED → GREEN → Coverage → REFACTOR)

## Common Patterns

**Async Testing:**
```typescript
it("blocks write to file outside allowedSurfaces", async () => {
  const hook = createContractEnforcementHook({ ... })
  await expect(
    hook({ tool: "write", sessionID: "ses_1" }, { args: { filePath: "/outside/file.ts" } })
  ).rejects.toThrow("[Harness] contract violation: agent test-agent not allowed to modify /outside/file.ts")
})

it("allows write when within allowedSurfaces", async () => {
  const hook = createContractEnforcementHook({ ... })
  await expect(hook(...)).resolves.toBeUndefined()
})
```

**Error Testing (sync and async):**
```typescript
// Sync
expect(() => parseSessionTitle("invalid")).toBeNull()

// Async reject
await expect(asyncOp()).rejects.toThrow("[Harness] Invalid ...")

// Async resolve
await expect(asyncOp()).resolves.toBeUndefined()

// Property-based
expect(error).toBeInstanceOf(Error)
expect(error.name).toBe("CommandNotFoundError")
expect(error.message).toBe("Custom msg")
```

**`[Harness]` Prefix Match in Tests:**
- Every error test asserts on the `[Harness]` prefix (e.g., `.rejects.toThrow("[Harness] contract violation: ...")`)
- This is a load-bearing convention — see CONVENTIONS.md → Error Handling

**Tool Test Pattern:**
```typescript
const tool = createDelegateTaskTool(coordinator as never)
const raw = await tool.execute({ agent: "builder", prompt: "build" } as never, ctx)
const result = parse(raw)
expect(result.kind).toBe("success")
expect(coordinator.dispatch).toHaveBeenCalledWith(expect.objectContaining({
  agent: "builder",
  parentSessionId: "ses_parent",
  prompt: "build",
  queueKey: "agent:builder",
}))
```

**Typed Mock Functions:**
```typescript
const mockHandleSessionEvent = vi.fn<[input: { eventType: string; sessionID: string; event: unknown }], Promise<void>>()
```

**TDD Evidence Labels (in test comments):**
```typescript
/**
 * RED phase: These tests MUST fail before implementation exists.
 * Test size: small (unit tests, no network/process boundary).
 * Public interface: createGatekeeper, GateDecision, GateResult.
 * Requirements: CP-01, CP-03, CP-04
 */
```
Pattern from `tests/lib/control-plane/gatekeeper.test.ts:1-10`.

**Snapshot Testing:**
- **Not used** in this codebase
- All assertions are explicit `expect(...)` calls

**Temp Directory Pattern (file-system tests):**
```typescript
import { promises as fs } from "node:fs"
import path from "node:path"
import os from "node:os"

let tmpDir: string
beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "hivemind-cp-test-"))
})
afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})
```

**Env Var Preservation Pattern (state tests):**
```typescript
it("continuity storage path resolves to canonical .hivemind/state/", () => {
  const oldStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
  delete process.env.OPENCODE_HARNESS_STATE_DIR
  try {
    const storagePath = getContinuityStoragePath()
    expect(storagePath).toContain(".hivemind")
  } finally {
    process.env.OPENCODE_HARNESS_STATE_DIR = oldStateDir
  }
})
```
Pattern from `tests/lib/state-root-migration.test.ts:32-43` — guarantees env var restoration even on assertion failure.

---

*Testing analysis: 2026-06-06*
*Update when test patterns change*
