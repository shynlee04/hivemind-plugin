# Testing Patterns

**Analysis Date:** 2024-05-24

## Test Framework

**Runner:**
- Node Native Test Runner (`node:test`)
- Config: Configured via package.json scripts (no separate config file)

**Assertion Library:**
- Node Native Assert (`node:assert/strict`)

**Run Commands:**
```bash
npm test               # Run all tests (includes boundary linting and test execution)
npm run test           # Alternate for running tests
tsx --test tests/*.test.ts # Direct test execution command
```

## Test File Organization

**Location:**
- Co-located with source files for unit tests (e.g., `src/features/agent-work-contract/engine/contract-store.test.ts`)
- Separate `tests/` directory for integration/runtime tests (e.g., `tests/runtime-tools.test.ts`)

**Naming:**
- `*.test.ts` (e.g., `contract-store.test.ts`, `plugin-runtime.test.ts`)

**Structure:**
```
src/
├── features/
│   └── [feature]/
│       ├── [module].ts
│       └── [module].test.ts
tests/
├── unit/
└── [integration-test].test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import test from 'node:test'
import assert from 'node:assert/strict'

test('Component - action - expected behavior', async () => {
  // Test body
})
```

**Patterns:**
- **Setup pattern:** Utilizing `mkdtemp` from `node:fs/promises` to create temporary directories per test.
- **Teardown pattern:** Using `try...finally` blocks to ensure temporary directories are removed with `rm(directory, { recursive: true, force: true })`.
- **Assertion pattern:** Utilizing `assert.equal`, `assert.deepEqual`, `assert.ok`, `assert.rejects`.

## Mocking

**Framework:** Custom mock objects, no heavy mocking framework detected.

**Patterns:**
```typescript
const mockInput = {
  client: {
    tui: { showToast: async () => undefined }
  },
  serverUrl: new URL('http://localhost:4096'),
  // ...other mock properties
} as never
```

**What to Mock:**
- External interfaces and UI dependencies (like TUI).
- Server URLs and runtime project states using bootstrapping utilities (`bootstrapReadyRuntime`).

**What NOT to Mock:**
- Disk operations, which instead use actual `fs` calls within temporary sandboxes (tmp directories).

## Fixtures and Factories

**Test Data:**
```typescript
function createTestContract(overrides: Partial<AgentWorkContract> = {}): AgentWorkContract {
  const now = new Date().toISOString()
  return {
    contractId: `contract-${Date.now()}`,
    sessionId: `session-${Date.now()}`,
    // ... default fields
    ...overrides,
  }
}
```

**Location:**
- Factory functions are defined directly within the test files they are used (e.g., `createTestContract` inside `contract-store.test.ts`, `createPluginInput` inside `runtime-tools.test.ts`).

## Coverage

**Requirements:** None enforced in `package.json`.

**View Coverage:**
```bash
Not configured out of the box.
```

## Test Types

**Unit Tests:**
- File-level unit tests testing isolated classes and state changes (e.g., `contract-store.test.ts` tests store behaviors).

**Integration Tests:**
- Tests interacting with the full Plugin system, building and asserting over runtime capabilities (e.g., `runtime-tools.test.ts`).

**E2E Tests:**
- Not explicitly defined, though plugin integration tests act close to end-to-end for the core features.

## Common Patterns

**Async Testing:**
```typescript
test('Async operation', async () => {
  const result = await someOperation()
  assert.equal(result, expected)
})
```

**Error Testing:**
```typescript
test('Throws expected error', async () => {
  await assert.rejects(
    async () => store.update('non-existent', { data: 'test' }),
    /not found/
  )
})
```

---

*Testing analysis: 2024-05-24*
