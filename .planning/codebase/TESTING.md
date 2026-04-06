# Testing Patterns

**Analysis Date:** 2026-04-06

## Test Framework

**Runner:**
- Vitest `^4.1.2`
- Config: `vitest.config.ts`
- Globals: `true` — `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach` available without import

**Assertion Library:**
- Vitest built-in `expect` (Jest-compatible API)

**Run Commands:**
```bash
npm test                    # Run all tests (vitest run)
npm run test:watch          # Watch mode (vitest)
npm run test:coverage       # Coverage report (vitest run --coverage)
npx vitest run tests/lib/helpers.test.ts        # Single test file
npx vitest run -t "should allow pending"        # Tests matching pattern
```

## Test File Organization

**Location:**
- Tests mirror `src/lib/` structure under `tests/lib/`
- Tool tests under `tests/tools/`
- Schema tests under `tests/schema-kernel/`
- Integration tests under `tests/integration/`
- Plugin tests under `tests/plugins/`

**Naming:**
- `*.test.ts` suffix: `tests/lib/helpers.test.ts`, `tests/tools/prompt-skim.test.ts`

**Structure:**
```
tests/
├── lib/                          # Unit tests for core library modules
│   ├── helpers.test.ts           # Pure function tests
│   ├── task-status.test.ts       # Status transition tests
│   ├── session-api.test.ts       # SDK wrapper tests (mocked)
│   ├── completion-detector.test.ts # Timer-based async tests
│   ├── notification-handler.test.ts # Notification formatting tests
│   └── agent-registry.test.ts    # Frontmatter parsing tests
├── tools/                        # Tool execution tests
│   ├── prompt-skim.test.ts
│   ├── prompt-analyze.test.ts
│   ├── context-budget.test.ts
│   └── session-patch.test.ts
├── schema-kernel/                # Zod contract tests
│   └── prompt-enhance.schema.test.ts
├── integration/                  # End-to-end pipeline tests
│   └── prompt-enhance-pipeline.test.ts
└── plugins/                      # Plugin hook tests
    └── prompt-enhance-compaction.test.ts
```

**Coverage config** (`vitest.config.ts`):
```typescript
coverage: {
  include: ["src/**/*.ts"],
  exclude: ["src/index.ts"],  // Barrel re-exports excluded
}
```

## Test Structure

**Suite Organization** — typical pattern from `tests/lib/helpers.test.ts`:
```typescript
import { describe, it, expect } from "vitest"
import { isObject, getNestedValue, asString } from "../../src/lib/helpers.js"

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

**Dynamic import pattern** — used in `tests/lib/task-status.test.ts` and `tests/lib/session-api.test.ts`:
```typescript
it("should allow pending -> queued", async () => {
  const { canTransition } = await import("../../src/lib/task-status.js")
  expect(canTransition("pending", "queued")).toBe(true)
})
```
Every test uses `await import(...)` instead of top-level import. This is a **known anti-pattern** — see Known Issues below.

**Setup/Teardown** — from `tests/lib/completion-detector.test.ts`:
```typescript
let detector: CompletionDetector

beforeEach(() => {
  vi.useFakeTimers()
  detector = new CompletionDetector(100)
})

afterEach(() => {
  vi.useRealTimers()
})
```

**Plugin-level tests** — from `tests/plugins/prompt-enhance-compaction.test.ts`:
```typescript
beforeEach(() => {
  mkdirSync(testDir, { recursive: true })
  process.chdir(testDir)
})

afterEach(() => {
  process.chdir(originalCwd)
  try { rmSync(testDir, { recursive: true, force: true }) } catch { /* ignore */ }
})
```

## Mocking

**Framework:** Vitest `vi.fn()` and `vi.mock()`

**Mock client pattern** — from `tests/lib/session-api.test.ts`:
```typescript
function mockClient() {
  return {
    session: {
      create: vi.fn(),
      get: vi.fn(),
      abort: vi.fn(),
      messages: vi.fn(),
      prompt: vi.fn(),
    },
  } as any
}

// Usage:
const client = mockClient()
client.session.create.mockResolvedValue({ data: { id: "s1", title: "test" } })
```

**Important:** Tests use `as any` for mock client typing rather than proper `Mock` types. This is a code quality gap.

**Timer mocking** — from `tests/lib/completion-detector.test.ts`:
```typescript
beforeEach(() => {
  vi.useFakeTimers()
})

it("resolves with timeout when no event arrives", async () => {
  const resultPromise = detector.watch("ses_1", 50)
  vi.advanceTimersByTime(60)
  await expect(resultPromise).resolves.toEqual({
    signal: "timeout",
    sessionID: "ses_1",
  })
})
```

**What to Mock:**
- OpenCode SDK client methods (`client.session.*`)
- File system operations (via `tmpdir()` + `process.chdir()`)
- Time-dependent behavior (via `vi.useFakeTimers()`)

**What NOT to Mock:**
- Pure utility functions (`helpers.ts`)
- Zod schema validation
- Tool implementations — test against real tool code

## Fixtures and Factories

**Test Data — mock context for tools** (repeated across `tests/tools/*.test.ts`):
```typescript
const mockCtx = {
  sessionID: "test_001",
  agent: "builder",
  directory: process.cwd(),
  worktree: process.cwd(),
  abort: new AbortController().signal,
  metadata: () => ({}),
  ask: async () => ({ state: "approved" as const }),
}
```
This pattern is duplicated in `tests/tools/prompt-skim.test.ts`, `tests/tools/prompt-analyze.test.ts`, and `tests/integration/prompt-enhance-pipeline.test.ts`. **Should be extracted to a shared test fixture.**

**Temporary directory pattern** — from `tests/plugins/prompt-enhance-compaction.test.ts`:
```typescript
const testDir = join(tmpdir(), "prompt-enhance-compaction-test")
beforeEach(() => {
  mkdirSync(testDir, { recursive: true })
  process.chdir(testDir)
})
afterEach(() => {
  process.chdir(originalCwd)
  rmSync(testDir, { recursive: true, force: true })
})
```

**Location:** No dedicated `tests/fixtures/` or `tests/factories/` directory exists. Shared patterns are duplicated inline.

## Coverage

**Requirements:** No minimum threshold enforced in config.

**View Coverage:**
```bash
npm run test:coverage
```

**Excluded from coverage:** `src/index.ts` (barrel re-exports)

**Known coverage gaps:**
- `src/plugin.ts` — complex hook logic (tool.execute.before/after, event, shell.env, system.transform, messages.transform, session.compacting) has no dedicated unit tests
- `src/lib/lifecycle-manager.ts` — the largest module (705 LOC) has no direct unit tests; behavior is only tested indirectly through integration tests
- `src/lib/state.ts` — no dedicated test file exists
- `src/lib/runtime.ts` — no dedicated test file exists
- `src/hooks/system-transform.ts` — no dedicated test file
- `src/hooks/messages-transform.ts` — no dedicated test file
- `src/shared/tool-response.ts` — no dedicated test file
- `src/plugins/prompt-enhance.ts` — only partially covered by `tests/plugins/prompt-enhance-compaction.test.ts`

## Test Types

**Unit Tests:**
- Located in `tests/lib/` and `tests/tools/`
- Test pure functions, status transitions, SDK wrappers, tool execution
- Use vitest globals, fake timers, mock clients

**Integration Tests:**
- `tests/integration/prompt-enhance-pipeline.test.ts` — end-to-end pipeline tests
- `tests/plugins/prompt-enhance-compaction.test.ts` — plugin hook integration
- Test schema contracts across tools, full tool pipelines, compaction tracking

**E2E Tests:**
- Not used. No Playwright, no browser automation for this project.

## Known Issues

### 1. Unnecessary dynamic imports in every test

**File:** `tests/lib/task-status.test.ts` (all 27 tests), `tests/lib/session-api.test.ts` (many tests)

**Issue:** Every test uses `await import("../../src/lib/task-status.js")` instead of a top-level import. This pattern:
- Masks import-time errors until test execution
- Adds unnecessary async overhead
- Makes test output harder to trace
- Prevents static analysis of test dependencies

**Correct pattern** (used in `tests/lib/helpers.test.ts`):
```typescript
import { isObject, getNestedValue } from "../../src/lib/helpers.js"

describe("isObject", () => {
  it("returns true for plain objects", () => {
    expect(isObject({})).toBe(true)
  })
})
```

### 2. Overly granular test cases masking structural gaps

**File:** `tests/lib/task-status.test.ts`

**Issue:** 27 individual tests for a 14-line module (`src/lib/task-status.ts`). Each transition is tested as a separate `it()` block:
```typescript
it("pending should transition to queued and cancelled", async () => { ... })
it("queued should transition to running and cancelled", async () => { ... })
it("running should transition to completed, error, cancelled, interrupt", async () => { ... })
```

Meanwhile, `src/lib/lifecycle-manager.ts` (705 LOC) has zero dedicated tests. Test effort is disproportionate to code complexity.

### 3. Duplicate test fixtures

The `mockCtx` object is copy-pasted across:
- `tests/tools/prompt-skim.test.ts`
- `tests/tools/prompt-analyze.test.ts`
- `tests/integration/prompt-enhance-pipeline.test.ts`
- `tests/tools/context-budget.test.ts`
- `tests/tools/session-patch.test.ts`

Should be extracted to `tests/fixtures/mock-context.ts`.

### 4. `as any` in test mocks

**File:** `tests/lib/session-api.test.ts`

**Issue:** `mockClient()` returns `as any`, bypassing TypeScript type checking:
```typescript
function mockClient() {
  return { session: { create: vi.fn(), get: vi.fn(), ... } } as any
}
```

This masks mismatched mock signatures. Should use Vitest's `Mock` types or the SDK's actual client type.

### 5. No tests for critical paths

**Untested modules:**
| Module | LOC | Risk |
|--------|-----|------|
| `src/lib/lifecycle-manager.ts` | 705 | Highest — delegation launch, queue management, background completion |
| `src/lib/state.ts` | 106 | Medium — in-memory state management |
| `src/lib/runtime.ts` | 69 | Medium — event-to-status inference |
| `src/plugin.ts` hooks | 477 | High — tool.execute.before/after circuit breaker, event handling |
| `src/hooks/system-transform.ts` | — | Medium — system prompt transformation |
| `src/hooks/messages-transform.ts` | 92 | Medium — message transformation |
| `src/shared/tool-response.ts` | 71 | Low — result rendering |

### 6. Bug-masking: silent catch blocks in production code

**File:** `src/lib/lifecycle-manager.ts` (lines 200–204)

```typescript
try {
  if (this.options.client?.session?.abort) {
    await this.options.client.session.abort({ path: { id: sessionID } })
  }
} catch {
  // Graceful handling — harness-internal state cleanup proceeds
}
```

The empty catch block means tests cannot verify whether `abort` was called or failed. This masks SDK integration bugs.

### 7. Integration test complexity

**File:** `tests/integration/prompt-enhance-pipeline.test.ts` — 406 lines

This single file tests schema contracts, tool execution, hook behavior, and pipeline orchestration. Should be split into focused test files by concern.

## Async Testing

**Pattern with fake timers** — from `tests/lib/completion-detector.test.ts`:
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

**Pattern with real async** — from `tests/tools/prompt-skim.test.ts`:
```typescript
it("counts words and lines correctly", async () => {
  const raw = await tool.execute(
    { content: "Hello world\nThis is a test", workspaceRoot: process.cwd() },
    mockCtx,
  )
  const result = parseResult(raw) as Record<string, unknown>
  expect(result.data.word_count).toBe(6)
})
```

## Error Testing

**Pattern — expecting throws:**
```typescript
it("throws on error property with string message", () => {
  expect(() => unwrapData({ error: "Something went wrong" })).toThrow(
    "Something went wrong"
  )
})
```

**Pattern — expecting rejection:**
```typescript
it("detects cyclic chains", async () => {
  const { walkParentChain } = await import("../../src/lib/session-api.js")
  await expect(walkParentChain(client, "a")).rejects.toThrow(/\[Harness\].*cyclic/)
})
```

**Pattern — best-effort (no throw):**
```typescript
it("should not throw if prompt fails (best-effort notification)", async () => {
  const mockPrompt = vi.fn().mockRejectedValue(new Error("session not found"))
  const client = { session: { prompt: mockPrompt } }
  await expect(notifyParentSession(client, "parent-2", task)).resolves.toBeUndefined()
})
```

---

*Testing analysis: 2026-04-06*
