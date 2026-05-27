# Testing Patterns

**Analysis Date:** 2026-05-28

## Test Framework

**Runner:**
- Vitest 4.1.7
- Config: `vitest.config.ts`

**Assertion Library:**
- Vitest built-in (`expect`, `describe`, `it`, `vi`)

**Run Commands:**
```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report (src/**/*.ts, excludes src/index.ts)
```

## Test File Organization

**Location:**
- Co-located in `tests/` directory mirroring `src/` structure
- Separate directories for different concern areas

**Naming:**
- Test files: `*.test.ts`
- Example: `src/shared/helpers.ts` → `tests/lib/helpers.test.ts`

**Structure:**
```
tests/
├── lib/                    # Unit tests for shared utilities
├── tools/                  # Tool implementation tests
├── hooks/                  # Hook lifecycle tests
├── integration/            # Integration tests
├── features/               # Feature-specific tests
└── *.test.ts               # Top-level test files
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi } from "vitest"
import { functionName } from "../../src/path/to/module.js"

describe("functionName", () => {
  it("returns expected result for valid input", () => {
    expect(functionName(input)).toBe(expected)
  })

  it("throws error for invalid input", () => {
    expect(() => functionName(invalidInput)).toThrow("[Harness] Error message")
  })
})
```

**Patterns:**
- One `describe` block per function/class
- One `it` block per test case
- Descriptive test names that explain expected behavior
- Arrange-Act-Assert pattern within each test

## Mocking

**Framework:** Vitest built-in (`vi.fn()`, `vi.spyOn()`)

**Patterns:**
```typescript
// Mock function
const mockFn = vi.fn().mockResolvedValue(result)

// Spy on method
const spy = vi.spyOn(DelegationManager.prototype, "handleSessionIdle")

// Mock module
vi.mock("../../src/module.js", () => ({
  functionName: vi.fn(),
}))

// Restore mocks after each test
afterEach(() => {
  vi.restoreAllMocks()
})
```

**What to Mock:**
- External SDK calls: `client.session.status()`, `client.app.log()`
- File system operations for unit tests
- Time-dependent functions: `Date.now()`

**What NOT to Mock:**
- Pure utility functions: `isObject()`, `getNestedValue()`
- Type guards and validators
- Internal business logic (test actual behavior)

## Fixtures and Factories

**Test Data:**
```typescript
// Create reusable test fixtures
function createManagerStub() {
  return {
    dispatch: vi.fn().mockResolvedValue({
      status: "dispatched",
      delegationId: "delegation-dispatch-123",
      executionMode: "sdk",
    }),
  }
}

// Create mock context
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

**Location:**
- Factory functions defined within test files
- Shared fixtures in `tests/fixtures/` (if needed)

## Coverage

**Requirements:**
- Statements: 85%
- Branches: 72%
- Functions: 85%
- Lines: 85%

**View Coverage:**
```bash
npm run test:coverage
# Generates: text, lcov, json-summary reports
```

**Coverage Configuration (from `vitest.config.ts`):**
```typescript
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
}
```

## Test Types

**Unit Tests:**
- Scope: Individual functions and classes
- Location: `tests/lib/`, `tests/tools/`, `tests/hooks/`
- Pattern: Mock external dependencies, test pure logic

**Integration Tests:**
- Scope: Multiple modules working together
- Location: `tests/integration/`
- Pattern: Real implementations with minimal mocking

**E2E Tests:**
- Framework: Not used (plugin runs within OpenCode runtime)
- Alternative: Integration tests with SDK mocks

## Common Patterns

**Async Testing:**
```typescript
it("handles async operations", async () => {
  const result = await asyncFunction(input)
  expect(result).toBe(expected)
})

it("rejects on error", async () => {
  await expect(asyncFunction(invalidInput)).rejects.toThrow("[Harness] Error")
})
```

**Error Testing:**
```typescript
it("throws [Harness] prefixed error", () => {
  expect(() => unwrapData({ error: "Something failed" })).toThrow(
    "[Harness] Something failed"
  )
})

it("extracts error messages from SDK shapes", () => {
  expect(() =>
    unwrapData({ error: { name: "UnknownError", data: { message: "Session not found" } } })
  ).toThrow("[Harness] Session not found")
})
```

**Type Assertions:**
```typescript
// Use type assertions for test doubles
const tool = createDelegateTaskTool(manager as never)
const hooks = createCoreHooks(deps as never)

// Parse JSON results
function parseResult(raw: string): Record<string, unknown> {
  return JSON.parse(raw) as Record<string, unknown>
}
```

**Environment Variables:**
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

## Test Documentation

**Comments:**
- Section headers for test groups: `// ---------------------------------------------------------------------------`
- Descriptive comments for complex test scenarios
- No excessive comments — tests should be self-documenting

**Example:**
```typescript
describe("delegate-task tool", () => {
  // ---------------------------------------------------------------------------
  // Plugin registration
  // ---------------------------------------------------------------------------

  it("is registered in the plugin tool surface as delegate-task", async () => {
    // ...
  })

  // ---------------------------------------------------------------------------
  // Dispatch behavior
  // ---------------------------------------------------------------------------

  it("dispatches to DelegationManager.dispatch() and returns delegationId", async () => {
    // ...
  })
})
```

---

*Testing analysis: 2026-05-28*