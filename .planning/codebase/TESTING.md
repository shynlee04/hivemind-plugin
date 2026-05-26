# Testing Strategy

**Generated:** 2026-05-26

## Overview

The Hivemind plugin uses Vitest as its primary testing framework with a comprehensive test coverage strategy targeting 85%+ coverage across statements, branches, functions, and lines. Tests are organized to mirror the source code structure, enabling easy navigation and maintenance.

## Testing Framework

### Framework and Configuration

- **Framework:** Vitest 4.1.7
- **Coverage Provider:** v8
- **Configuration:** `vitest.config.ts`

### Key Configuration Settings

```typescript
// vitest.config.ts
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

### Setup and Teardown

Tests use Vitest's `beforeEach` and `afterEach` hooks:

```typescript
// tests/lib/state.test.ts
describe("TaskStateManager", () => {
  let mgr: TaskStateManager

  beforeEach(() => {
    mgr = new TaskStateManager()
  })
})
```

## Test Structure

### Unit Tests

Unit tests are organized by feature area under `tests/lib/`:

```
tests/lib/
├── helpers.test.ts                    # Utility functions
├── state.test.ts                      # State management
├── delegation-manager.test.ts         # Delegation logic
├── continuity.test.ts                 # Session persistence
├── lifecycle-manager.test.ts          # Lifecycle management
└── ...
```

### Integration Tests

Integration tests verify interactions between modules under `tests/integration/`:

```
tests/integration/
├── delegation-v2-integration.test.ts  # Delegation flow
└── prompt-enhance-pipeline.test.ts    # Enhancement pipeline
```

### Feature Tests

Feature-specific tests under `tests/features/`:

```
tests/features/
├── session-tracker/
│   ├── index.test.ts
│   ├── integration/
│   │   ├── pipeline.test.ts
│   │   └── e2e-verification.test.ts
│   ├── capture/
│   └── persistence/
└── governance-engine/
```

### Test Naming Convention

- Format: `{description}.test.ts`
- Example: `delegation-manager.test.ts`, `continuity.test.ts`

### Test Organization Pattern

```typescript
import { describe, it, expect, beforeEach } from "vitest"
import { TaskStateManager } from "../../src/shared/state.js"

describe("TaskStateManager", () => {
  let mgr: TaskStateManager

  beforeEach(() => {
    mgr = new TaskStateManager()
  })

  // -------------------------------------------------------------------------
  // Construction
  // -------------------------------------------------------------------------
  describe("construction", () => {
    it("constructs with empty state", () => {
      expect(mgr.getStats("nonexistent")).toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  // Session stats
  // -------------------------------------------------------------------------
  describe("session stats", () => {
    it("ensureStats creates new stats", () => {
      const stats = mgr.ensureStats("sid-1")
      expect(stats).toMatchObject({ total: 0 })
    })
  })
})
```

## Mocking Strategy

### Mocking Library

- **Library:** Vitest built-in `vi` API
- **No external mocking library required**

### Mock Patterns Used

#### Function Mocking

```typescript
// tests/integration/delegation-v2-integration.test.ts
function createClient() {
  return {
    app: {
      agents: vi.fn(async () => [
        { name: "builder", tools: { read: true } },
        { name: "critic", tools: { read: true } }
      ]),
      log: vi.fn(async () => undefined),
    },
  }
}
```

#### Object Mocking

```typescript
const mockData = vi.fn()
mockData.mockImplementation(() => ({ id: "test-id" }))
```

#### Module Mocking

```typescript
vi.mock("../../src/shared/helpers.js", () => ({
  getNestedValue: vi.fn((obj, path) => {
    return path[0] in obj ? obj[path[0]] : undefined
  }),
}))
```

### Stub Implementations

Stubs provide minimal implementations for testing dependencies:

```typescript
function createRuntimeClient() {
  return {
    app: {
      agents: vi.fn(async () => [{ name: "builder", tools: { read: true } }]),
      log: vi.fn(async () => undefined),
    },
    session: {
      create: vi.fn(async () => ({ data: { id: "child-integration" } })),
      promptAsync: vi.fn(async () => ({ data: undefined })),
    },
  }
}
```

## Coverage

### Coverage Tools

- **Provider:** v8 coverage engine
- **Reporters:** text (console), lcov (coverage reports), json-summary (CI parsing)

### Coverage Targets

- **Statements:** 85%
- **Branches:** 72%
- **Functions:** 85%
- **Lines:** 85%

### Current Coverage

According to `vitest.config.ts` comments, the Node 20 baseline measured:
- Statements: 89.94%
- Branches: 79.25%
- Functions: 92.38%
- Lines: 90.95%

Coverage excludes barrel files (`src/index.ts`, `src/**/index.ts`) as they are aggregation points, not business logic.

### Viewing Coverage

```bash
npm run test:coverage  # Generate coverage report
```

## Test Commands

### Running All Tests

```bash
npm test                    # Run all tests once
npm run test:watch         # Watch mode with automatic re-run
```

### Running Specific Test Files

```bash
npx vitest run tests/lib/state.test.ts              # Single test file
npx vitest run -t "TaskStateManager"                 # Run specific test
```

### Coverage Reporting

```bash
npm run test:coverage                    # Generate coverage report
npx vitest run --coverage                # Run with coverage
```

### Coverage Output Locations

- **Console:** Text summary in terminal
- **lcov:** `coverage/lcov.info` for CI tools
- **json-summary:** `coverage/coverage-final.json` for programmatic access

## Test Types

### Unit Tests

Unit tests verify individual functions and classes in isolation:

```typescript
describe("isObject", () => {
  it("returns true for plain objects", () => {
    expect(isObject({})).toBe(true)
    expect(isObject({ a: 1 })).toBe(true)
  })

  it("returns false for null", () => {
    expect(isObject(null)).toBe(false)
  })

  it("returns false for arrays", () => {
    expect(isObject([])).toBe(false)
  })
})
```

### Integration Tests

Integration tests verify interactions between multiple modules:

```typescript
describe("delegation v2 plugin integration", () => {
  it("starts delegate-task through SDK child-session starter", async () => {
    const client = createRuntimeClient()
    const modules = setupDelegationModules({ client, persistDelegations: () => undefined })
    const tool = createDelegateTaskTool(modules.delegationManager)

    const raw = await tool.execute({ agent: "builder", prompt: "build" }, { sessionID: "parent-1" })
    const result = JSON.parse(raw)
    
    expect(result.kind).toBe("success")
    expect(client.session.create).toHaveBeenCalled()
    expect(client.session.promptAsync).toHaveBeenCalled()
  })
})
```

### E2E Tests

End-to-end tests verify complete workflows:

```typescript
// tests/features/session-tracker/integration/e2e-verification.test.ts
// Full lifecycle tests from session creation to completion
```

## Common Patterns

### Async Testing

```typescript
// Using async/await with expect
it("handles async operations correctly", async () => {
  const result = await someAsyncFunction()
  expect(result).toBe(expected)
})

// Using promises with expect
it("resolves to correct value", (done) => {
  someAsyncFunction().then(result => {
    expect(result).toBe(expected)
    done()
  }).catch(done.fail)
})
```

### Error Testing

```typescript
it("throws error on invalid input", () => {
  expect(() => {
    processInvalidInput(null)
  }).toThrow("[Harness] Invalid input provided")
})

it("handles errors gracefully", async () => {
  const response = await tool.execute(args, context)
  expect(response.kind).toBe("error")
  expect(response.error).toContain("expected error message")
})
```

### Match Object Pattern

```typescript
expect(result).toMatchObject({
  kind: "success",
  data: { id: "test-id" }
})
```

### Test Data Factories

```typescript
const makeValidMeta = (rootID: string): DelegationMeta => ({
  rootID,
  depth: 1,
  budgetUsed: 1,
  agent: "builder",
  queueKey: "default",
})
```

## Test Organization

### Directory Structure

```
tests/
├── lib/                           # Unit tests mirroring src/
│   ├── shared/
│   │   ├── helpers.test.ts
│   │   └── state.test.ts
│   ├── coordination/
│   │   ├── delegation/
│   │   └── concurrency/
│   └── task-management/
├── integration/                   # Integration tests
│   ├── delegation-v2-integration.test.ts
│   └── prompt-enhance-pipeline.test.ts
├── features/                      # Feature-specific tests
│   ├── session-tracker/
│   ├── governance-engine/
│   └── auto-loop/
├── sidecar/                       # Sidecar component tests
└── eval/                          # Evaluation tests
    ├── coherence.test.ts
    ├── correctness.test.ts
    └── stability.test.ts
```

### Test File Location Convention

Test files mirror their source counterparts:

```
src/shared/helpers.ts       -> tests/lib/helpers.test.ts
src/coordination/delegation/ -> tests/lib/coordination/delegation/
src/features/session-tracker/ -> tests/features/session-tracker/
```

## Best Practices

### Descriptive Test Names

```typescript
// Good
it("returns undefined for missing nested path", () => {
  const obj = { a: { b: 1 } }
  expect(getNestedValue(obj, ["a", "c"])).toBeUndefined()
})

// Bad
it("test 1", () => {
  // ...
})
```

### Arrange-Act-Assert Pattern

```typescript
it("creates new stats for unknown session", () => {
  // Arrange
  const mgr = new TaskStateManager()
  
  // Act
  const first = mgr.ensureStats("sid-1")
  
  // Assert
  expect(first).toMatchObject({ total: 0 })
  expect(first).toBe(mgr.getStats("sid-1"))
})
```

### Test Isolation

Each test should be independent and not rely on the state of other tests:

```typescript
beforeEach(() => {
  mgr = new TaskStateManager()  // Fresh instance for each test
})
```

---

*Testing analysis: 2026-05-26*
