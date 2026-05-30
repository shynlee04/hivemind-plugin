# Testing Patterns — Harness Modules

> Patterns for testing the opencode-harness (`src/lib/`, `src/tools/`).

## Project Test Structure

```
tests/
├── lib/                           # Unit tests for src/lib/
│   ├── helpers.test.ts            # Pure utility tests
│   ├── concurrency.test.ts        # Semaphore tests
│   ├── task-status.test.ts        # Status transition tests
│   ├── completion-detector.test.ts # Two-signal detection tests
│   ├── continuity.test.ts         # Persistence tests
│   ├── state.test.ts              # In-memory state tests
│   ├── runtime.test.ts            # Event→status mapping tests
│   ├── lifecycle-manager.test.ts  # Lifecycle state machine tests
│   ├── delegation-manager.test.ts # Delegation orchestrator tests
│   ├── delegation-persistence.test.ts # Delegation record I/O tests
│   ├── runtime-policy.test.ts     # Policy loading tests
│   └── session-api.test.ts        # SDK wrapper tests
└── tools/                         # Tool-focused tests
    ├── delegate-task.test.ts      # Delegation tool tests
    ├── delegation-status.test.ts  # Status polling tests
    ├── prompt-skim.test.ts        # Prompt skim tests
    ├── prompt-analyze.test.ts     # Prompt analysis tests
    └── session-patch.test.ts      # Session patch tests
```

## Pattern 1: Pure Function Testing

For leaf modules: `helpers.ts`, `task-status.ts`, `runtime.ts`

```typescript
describe('helpers', () => {
  describe('formatSessionId', () => {
    it('formats with prefix', () => {
      expect(formatSessionId('abc')).toBe('[Harness:abc]')
    })

    it('handles empty input', () => {
      expect(formatSessionId('')).toBe('[Harness:]')
    })
  })
})
```

## Pattern 2: State Machine Testing

For `task-status.ts`, `lifecycle-manager.ts`

```typescript
describe('task-status transitions', () => {
  it('allows pending → running', () => {
    expect(canTransition('pending', 'running')).toBe(true)
  })

  it('blocks pending → completed', () => {
    expect(canTransition('pending', 'completed')).toBe(false)
  })

  it.each([
    ['pending', 'running', true],
    ['running', 'completed', true],
    ['running', 'failed', true],
    ['completed', 'running', false],
    ['failed', 'pending', false],
  ])('transition %s → %s = %s', (from, to, expected) => {
    expect(canTransition(from as TaskStatus, to as TaskStatus)).toBe(expected)
  })
})
```

## Pattern 3: File I/O Testing (continuity, persistence)

```typescript
describe('continuity', () => {
  const testDir = join(tmpdir(), `harness-test-${Date.now()}`)

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  it('persists and reads state', async () => {
    const store = new ContinuityStore({ stateDir: testDir })
    await store.write('sessions', { 'sid-1': { status: 'running' } })

    const read = await store.read('sessions')
    expect(read).toEqual({ 'sid-1': { status: 'running' } })
  })

  it('deep-clones on read', async () => {
    const store = new ContinuityStore({ stateDir: testDir })
    await store.write('data', { nested: { value: 1 } })

    const first = await store.read('data')
    first.nested.value = 999

    const second = await store.read('data')
    expect(second.nested.value).toBe(1)  // Not mutated
  })
})
```

## Pattern 4: Concurrency Testing

For `concurrency.ts` (keyed semaphore)

```typescript
describe('Semaphore', () => {
  it('allows up to max concurrent acquisitions', async () => {
    const sem = new Semaphore(2)
    const order: number[] = []

    const p1 = sem.acquire().then(() => { order.push(1) })
    const p2 = sem.acquire().then(() => { order.push(2) })
    const p3 = sem.acquire().then(() => { order.push(3) })

    await Promise.all([p1, p2])
    expect(order).toEqual([1, 2])

    // p3 is queued — release one
    sem.release()
    await p3
    expect(order).toEqual([1, 2, 3])
  })
})
```

## Pattern 5: Error Handling Testing

Harness uses `[Harness]` prefix on all errors.

```typescript
describe('error handling', () => {
  it('throws with [Harness] prefix', () => {
    expect(() => validateSessionId('')).toThrow('[Harness]')
  })

  it('throws specific error type', () => {
    expect(() => validateSessionId('')).toThrow(
      expect.objectContaining({
        message: expect.stringContaining('[Harness] sessionId must not be empty'),
      })
    )
  })
})
```

## Pattern 6: Tool Response Testing

For `src/tools/*.ts` — tools use standard response envelope from `src/shared/tool-response.ts`

```typescript
describe('delegate-task tool', () => {
  it('returns delegation ID on success', async () => {
    const result = await handleDelegateTask({
      agent: 'test-agent',
      prompt: 'do something',
    })

    expect(result).toEqual({
      content: expect.arrayContaining([
        expect.objectContaining({
          type: 'text',
          text: expect.stringContaining('delegation'),
        }),
      ]),
    })
  })
})
```

## Pattern 7: Dual-Layer State Testing

Testing the in-memory + durable JSON pattern.

```typescript
describe('dual-layer state', () => {
  it('in-memory map reflects persisted state after reload', async () => {
    // Write to durable store
    await continuity.write('budgets', { 'sid-1': { used: 100, max: 500 } })

    // Reload in-memory state
    const state = loadStateFromContinuity(continuity)

    expect(state.rootBudgets.get('sid-1')).toEqual({ used: 100, max: 500 })
  })
})
```

## Test Setup Pattern

```typescript
// tests/setup.ts — runs before each suite
import { vi } from 'vitest'

// Suppress console noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
// Keep console.error for debugging

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})
```

---

*Patterns derived from harness architecture: `src/lib/` modules, `AGENTS.md` coding standards, and vitest globals mode.*
