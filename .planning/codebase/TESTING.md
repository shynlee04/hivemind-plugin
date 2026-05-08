# Testing Patterns

**Analysis Date:** 2026-05-08

## Test Framework

**Runner:**
- Vitest 4.x (`^4.1.5`)
- Config: `vitest.config.ts` at project root
- Globals mode enabled (`globals: true`)
- Coverage provider: `v8` (`@vitest/coverage-v8 ^4.1.5`)

**Assertion Library:**
- Vitest built-in `expect` (no separate assertion library)

**Run Commands:**
```bash
npm test                     # Run all tests (vitest run)
npm run test:watch           # Watch mode (vitest)
npm run test:coverage        # Run with coverage report
npx vitest run tests/lib/helpers.test.ts                    # Single file
npx vitest run -t "<test name>"                             # Name-filtered
npx vitest run tests/lib/                                  # Directory-scoped
```

## Test File Organization

**Location:**
- Separate `tests/` directory at project root, mirroring `src/` structure
- `tests/lib/` ⇔ source in `src/coordination/`, `src/task-management/`, `src/features/` (legacy grouping from pre-refactor)
- `tests/tools/` ⇔ `src/tools/`
- `tests/hooks/` ⇔ `src/hooks/`
- `tests/schema-kernel/` ⇔ `src/schema-kernel/`
- `tests/cli/` ⇔ `src/cli/`
- `tests/plugin/` ⇔ `src/plugin.ts` (bootstrap/registration tests)
- `tests/integration/` ⇔ cross-tool pipeline tests (no single source mirror)
- `tests/sidecar/` ⇔ `src/sidecar/`

**Naming:**
- All test files use `*.test.ts` suffix
- Mirror source filename exactly: `src/shared/helpers.ts` → `tests/lib/helpers.test.ts`
- Multi-file modules: `tests/tools/prompt-skim.test.ts` maps to `src/tools/prompt/prompt-skim/`

**Structure:**
```
tests/
├── lib/                        # Legacy grouping for coordination/task-mgmt/features
│   ├── helpers.test.ts
│   ├── state.test.ts
│   ├── completion-detector.test.ts
│   ├── delegation-state-machine.test.ts
│   ├── runtime-policy.test.ts
│   ├── config-workflow/
│   ├── prompt-packet/
│   ├── recovery/
│   ├── security/
│   ├── spawner/
│   └── ...
├── tools/
│   ├── prompt-skim.test.ts
│   ├── prompt-analyze.test.ts
│   ├── session-patch.test.ts
│   ├── configure-primitive.test.ts
│   └── validate-restart.test.ts
├── hooks/
│   ├── create-core-hooks.test.ts
│   ├── create-session-hooks.test.ts
│   ├── create-tool-guard-hooks.test.ts
│   ├── hook-cqrs-boundary.test.ts
│   └── governance-block.test.ts
├── schema-kernel/
│   ├── hivemind-configs.schema.test.ts
│   ├── prompt-enhance.schema.test.ts
│   └── opencode-config.schemas.test.ts
├── cli/
│   ├── commands/
│   ├── discovery.test.ts
│   └── router.test.ts
├── plugin/
│   └── bootstrap-tools-registration.test.ts
├── integration/
│   └── prompt-enhance-pipeline.test.ts
└── sidecar/
    └── readonly-state.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
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
})
```

**Patterns:**
- One `describe` per exported function/class
- One `it` per behavior (descriptive lowercase names)
- Nested `describe` blocks for grouping related behaviors
- `beforeEach` for common setup (instantiation, temp dirs, timers, env vars)
- `afterEach` for teardown (restore timers, delete temp dirs, reset env)
- Section comments with `// --- label ---` for visual grouping

**Setup/Teardown:**
```typescript
describe("CompletionDetector", () => {
  let detector: CompletionDetector

  beforeEach(() => {
    vi.useFakeTimers()
    detector = new CompletionDetector(100)
  })

  afterEach(() => {
    vi.useRealTimers()
  })
  // ...
})
```

**Test Data Factories:**
```typescript
const makeValidMeta = (rootID: string): DelegationMeta => ({
  rootID,
  depth: 1,
  budgetUsed: 1,
  agent: "builder",
  queueKey: "default",
})

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

**Assertion Patterns:**
- `expect(value).toBe(expected)` — strict equality for primitives
- `expect(value).toEqual(expected)` — deep equality for objects/arrays
- `expect(value).toMatchObject(partial)` — subset match
- `expect(value).toBeDefined()` / `.toBeUndefined()` — presence checks
- `expect(() => fn()).toThrow(/regex/)` — error assertion with pattern
- `expect(promise).resolves.toEqual(...)` — async success
- `expect(Set).toBeEmpty()` (via `size === 0` or `expect(set.size).toBe(0)`)
- `expect(array).toContain(item)` — membership

## Mocking

**Framework:** Vitest `vi` utilities (built-in)

**Module-Level Mocking (`vi.mock`):**
```typescript
vi.mock("bun-pty", () => ({
  PtyManager: class {
    isSupported = vi.fn(() => false)
  },
}))

vi.mock("../../../src/shared/session-api.js", async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, createSession: vi.fn() }
})

vi.mock("../../../src/config/subscriber.js", () => ({
  getCachedConfig: vi.fn(() => ({ features: {} })),
}))
```

**Method-Level Mocking (`vi.spyOn`):**
```typescript
vi.spyOn(sessionApi, "getSessionMessageCount").mockResolvedValue(0)
vi.spyOn(PtyManager.prototype, "isSupported").mockReturnValue(false)
vi.spyOn(console, "error").mockImplementation(() => {})
vi.spyOn(process, "cwd").mockReturnValue("/process-cwd")
```

**Timer Mocking:**
```typescript
beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })
// In tests:
vi.advanceTimersByTime(100)
vi.advanceTimersByTime(60)
```

**Dynamic Import for Module-Level Mocks:**
When `vi.mock` is used, the module must be dynamically imported AFTER the mocks:
```typescript
describe("bootstrap tool registration", () => {
  it("registers tools", async () => {
    const { HarnessControlPlane } = await import("../../src/plugin.js")
    const plugin = await HarnessControlPlane({ client: {}, directory: process.cwd() } as never)
    // ...
  })
})
```

**Reset Between Tests:**
```typescript
beforeEach(() => {
  vi.resetModules()       // Clear module cache
  vi.unmock("node:fs")    // Remove module-level mock
})
afterEach(() => {
  vi.doUnmock("node:fs")  // Restore
  vi.resetModules()
})
```

**What to Mock:**
- External SDKs (`@opencode-ai/sdk`, `bun-pty`)
- File system operations when testing persistence logic (`node:fs`)
- Session API wrappers when testing delegation/state machines (`src/shared/session-api.js`)
- Config subscribers when testing config-dependent behavior
- `console.error` to suppress expected error output in tests

**What NOT to Mock:**
- Pure utility functions (`helpers.ts`, `task-status.ts`, `tool-response.ts`)
- State managers under test (`TaskStateManager` is instantiated directly)
- Zod schemas (tested via `safeParse` on real instances)
- Internal module boundaries within the same concern

## Test Tool Executions

**Testing Tool Implementations:**
```typescript
const mockCtx = {
  sessionID: "test_ses_001",
  agent: "builder",
  directory: process.cwd(),
  worktree: process.cwd(),
  abort: new AbortController().signal,
  metadata: () => ({}),
  ask: async () => ({ state: "approved" as const }),
}

// Direct execute call
const tool = createPromptSkimTool(process.cwd())
const raw = await tool.execute(
  { content: "MUST build this. NEVER do that.\nCheck https://example.com", workspaceRoot: process.cwd() },
  mockCtx,
)
const parsed = JSON.parse(raw)
expect(parsed.kind).toBe("success")
```

## Schema Testing

**Zod Schema Validation:**
```typescript
it("prompt-skim output validates against PromptSkimResultSchema", async () => {
  const raw = await tool.execute(args, mockCtx)
  const parsed = JSON.parse(raw)
  const result = PromptSkimResultSchema.safeParse(parsed.data)
  expect(result.success).toBe(true)
})
```

Use `safeParse` (not `parse`) to avoid throwing — test the `success` boolean directly.

## Coverage

**Requirements:**
- Coverage thresholds enforced in `vitest.config.ts`:
  - Statements: **85%**
  - Branches: **72%**
  - Functions: **85%**
  - Lines: **85%**
- Coverage includes `src/**/*.ts`, excludes `src/index.ts` and `src/**/index.ts` (barrel files)
- Reporters: `text`, `lcov`, `json-summary`
- Provider: `v8`
- Thresholds are gated — lowering requires explicit audit amendment

**View Coverage:**
```bash
npm run test:coverage
```

**Current State (as of build audit):**
~1,765/1,767 tests passing (2 known session-journal taxonomy failures)

## Test Types

**Unit Tests:**
- Located in `tests/lib/`, `tests/tools/`, `tests/hooks/`, `tests/schema-kernel/`
- Test individual functions, classes, and modules in isolation
- Heavy use of `vi.mock` for external dependencies
- Fast execution with fake timers

**Integration Tests:**
- Located in `tests/integration/`
- Test cross-tool pipelines (e.g., prompt-enhance: skim → analyze → patch)
- Use real tool instances with Zod schema validation
- Filesystem operations use `tmpdir()` with cleanup in `afterEach`

**E2E Tests:** Not detected — no E2E test framework present.

## Common Patterns

**Async Testing:**
```typescript
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
it("throws on error property with string message", () => {
  expect(() => unwrapData({ error: "Something went wrong" })).toThrow(
    "[Harness] Something went wrong"
  )
})

it("throws when exceeding max with [Harness] prefix", () => {
  expect(() => mgr.reserveDescendant("root-limit", 3)).toThrow(/^\[Harness\]/)
})
```

**Temp Directory Testing:**
```typescript
let stateDir: string
beforeEach(() => {
  stateDir = mkdtempSync(join(tmpdir(), "continuity-test-"))
})
afterEach(() => {
  rmSync(stateDir, { recursive: true, force: true })
})
```

**Environment Variable Testing:**
```typescript
let previousEnv: string | undefined
beforeEach(() => {
  previousEnv = process.env.OPENCODE_HARNESS_STATE_DIR
  process.env.OPENCODE_HARNESS_STATE_DIR = "/test/path"
})
afterEach(() => {
  if (previousEnv === undefined) {
    delete process.env.OPENCODE_HARNESS_STATE_DIR
  } else {
    process.env.OPENCODE_HARNESS_STATE_DIR = previousEnv
  }
})
```

**Conformance Tests:**
Phase-specific conformance tests validate architectural contracts:
```typescript
import { describe, it, expect } from "vitest"
// tests/lib/phase39-conformance.test.ts
// tests/lib/runtime-pressure/phase59-authority-matrix.test.ts
// tests/lib/runtime-pressure/phase67-conformance.test.ts
```

**Regression Tests:**
Named test files for specific regression scenarios:
```typescript
// tests/lib/completion-detector-crash.test.ts
// tests/lib/config-workflow/workflow-regression.test.ts
```

---

*Testing analysis: 2026-05-08*
