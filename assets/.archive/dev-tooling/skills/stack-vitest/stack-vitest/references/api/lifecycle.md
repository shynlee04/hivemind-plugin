# Lifecycle API — Test Structure & Hooks

> Define test suites, individual tests, and manage setup/teardown lifecycle.

## Import

```typescript
import { describe, it, test, beforeAll, afterAll, beforeEach, afterEach, bench } from 'vitest'
```

---

## Test & Suite Definition

### `describe(name, fn)` / `suite(name, fn)`

Group related tests. Supports nesting.

```typescript
describe('DelegationManager', () => {
  describe('dispatch', () => {
    it('creates a child session', () => { /* ... */ })
    it('respects concurrency limits', () => { /* ... */ })
  })
})
```

### `it(name, fn, timeout?)` / `test(name, fn, timeout?)`

Define a single test case. `it` and `test` are aliases.

```typescript
it('should return 42', () => {
  expect(answer()).toBe(42)
})

// Async tests
it('resolves delegation', async () => {
  const result = await delegate('agent', 'prompt')
  expect(result).toBeDefined()
})

// With timeout (ms)
it('long operation', () => { /* ... */ }, 10000)  // 10s timeout
```

### `bench(name, fn, options?)`

Define a benchmark test.

```typescript
bench('serialize state', () => {
  serializeState({ sessions: new Map(), budgets: new Map() })
})

bench('sort large array', () => {
  Array.from({ length: 10000 }, (_, i) => i).sort()
}, { iterations: 100 })
```

---

## Chainable Modifiers

All apply to `describe`, `it`, `test`, and `bench`:

```typescript
// Skip / Only
it.skip('not ready yet', () => {})
describe.skip('broken suite', () => {})
it.only('run just this', () => {})

// Todo
it.todo('implement later')

// Expected failure
it.fails('should throw', () => {
  expect(() => throwIf(true)).toThrow()
})

// Concurrency
it.concurrent('runs in parallel', () => {})
describe.concurrent('all tests parallel', () => {})
it.sequential('force sequential', () => {})

// Data-driven
it.each([
  [1, 1, 2],
  [1, 2, 3],
  [2, 2, 4],
])('add(%i, %i) = %i', (a, b, expected) => {
  expect(a + b).toBe(expected)
})

// Object-driven ( Vitest 4.x )
test.for([
  { input: 1, expected: 2 },
  { input: 2, expected: 4 },
])('double $input = $expected', ({ input, expected }) => {
  expect(input * 2).toBe(expected)
})

// Conditional
const isCI = process.env.CI === 'true'
it.runIf(isCI)('CI only test', () => {})
it.skipIf(!isCI)('skip in local', () => {})

// Scoped variants (4.1+)
test.describe('scoped describe', () => {})
test.suite('scoped suite', () => {})
```

---

## Lifecycle Hooks

### `beforeAll(fn, timeout?)`

Run once before all tests in the current describe block.

```typescript
beforeAll(async () => {
  await initializeTestDatabase()
})
```

### `afterAll(fn, timeout?)`

Run once after all tests in the current describe block.

```typescript
afterAll(async () => {
  await cleanupTestDatabase()
})
```

### `beforeEach(fn, timeout?)`

Run before each test in the current describe block.

```typescript
beforeEach(() => {
  vi.clearAllMocks()
})
```

### `afterEach(fn, timeout?)`

Run after each test in the current describe block.

```typescript
afterEach(() => {
  vi.restoreAllMocks()
})
```

### `aroundEach(fn)` (4.1+)

Wrap each test — provides a `use()` callback for the test body.

```typescript
aroundEach(async (options, use) => {
  // Before each test
  const db = await createTestDb()
  // Run the test
  await use({ db })
  // After each test (cleanup)
  await db.close()
})
```

### `aroundAll(fn)` (4.1+)

Wrap the entire suite.

```typescript
aroundAll(async (options, use) => {
  const server = await startTestServer()
  await use({ port: server.port })
  await server.stop()
})
```

### `onTestFailed(fn)` / `onTestFinished(fn)`

In-test callbacks for conditional cleanup or logging.

```typescript
it('complex operation', () => {
  const logFile = createTempLog()
  
  onTestFailed(() => {
    console.log('Test failed! Log contents:', readFileSync(logFile, 'utf-8'))
  })
  
  onTestFinished(() => {
    unlinkSync(logFile)
  })
  
  // Test body
})
```

---

## Fixture System — `test.extend()`

Create reusable test context with dependency injection and automatic cleanup.

```typescript
import { test as base, expect } from 'vitest'

interface Fixtures {
  db: Database
  user: User
}

const test = base.extend<Fixtures>({
  db: async ({}, use) => {
    const db = await createTestDatabase()
    await use(db)           // Provided to test
    await db.close()         // Cleanup after test
  },

  user: async ({ db }, use) => {
    const user = await db.insertUser({ name: 'test' })
    await use(user)
    // No cleanup needed — db fixture handles it
  },
})

test('user has id', async ({ user, db }) => {
  expect(user.id).toBeDefined()
  const found = await db.findUser(user.id)
  expect(found).toEqual(user)
})
```

### `test.override()` — Per-suite fixture override

```typescript
describe('admin tests', () => {
  const adminTest = test.override({
    user: async ({ db }, use) => {
      const admin = await db.insertUser({ name: 'admin', role: 'admin' })
      await use(admin)
    },
  })

  adminTest('admin has elevated permissions', async ({ user }) => {
    expect(user.role).toBe('admin')
  })
})
```

### Fixture Scoping

```typescript
const test = base.extend({
  // Per-test scope (default) — created/destroyed per test
  db: async ({}, use) => { /* ... */ },

  // Worker scope — shared across tests in same worker
  sharedPool: [async ({}, use) => {
    const pool = createPool()
    await use(pool)
    await pool.drain()
  }, { scope: 'worker' }],
})
```

---

*Source: Vitest 4.x API docs, Context7 `/vitest-dev/vitest`, DeepWiki*
