# Mocking Patterns — SDK, Delegation, Continuity

> Specific mocking patterns for the hivemind test suite.

## Pattern 1: Mocking OpenCode SDK Calls

For testing `src/lib/session-api.ts` consumers.

```typescript
import { vi } from 'vitest'

// Mock the session API module
vi.mock('../lib/session-api', () => ({
  createSession: vi.fn(),
  sendMessage: vi.fn(),
  getSession: vi.fn(),
  cancelSession: vi.fn(),
  listSessions: vi.fn(),
}))

import { createSession, sendMessage } from '../lib/session-api'

describe('with mocked SDK', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('delegates via SDK', async () => {
    vi.mocked(createSession).mockResolvedValue({ id: 'child-1' })
    vi.mocked(sendMessage).mockResolvedValue({ content: 'result' })

    const result = await delegateViaSDK('test-agent', 'do work')

    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({ agent: 'test-agent' })
    )
    expect(result).toBeDefined()
  })
})
```

## Pattern 2: Mocking Delegation Sessions

For testing `DelegationManager` without real child sessions.

```typescript
const mockDelegationManager = {
  dispatch: vi.fn(),
  getStatus: vi.fn(),
  getResult: vi.fn(),
  cancel: vi.fn(),
}

describe('delegation flow', () => {
  it('dispatches and polls for completion', async () => {
    mockDelegationManager.dispatch.mockResolvedValue('del-1')
    mockDelegationManager.getStatus
      .mockResolvedValueOnce('running')
      .mockResolvedValueOnce('running')
      .mockResolvedValueOnce('completed')
    mockDelegationManager.getResult.mockResolvedValue({
      output: 'task complete',
    })

    const id = await mockDelegationManager.dispatch({
      agent: 'builder',
      prompt: 'build feature',
    })

    // Poll loop simulation
    let status = await mockDelegationManager.getStatus(id)
    expect(status).toBe('running')

    status = await mockDelegationManager.getStatus(id)
    expect(status).toBe('running')

    status = await mockDelegationManager.getStatus(id)
    expect(status).toBe('completed')

    const result = await mockDelegationManager.getResult(id)
    expect(result.output).toBe('task complete')
  })
})
```

## Pattern 3: Mocking Continuity Store (File I/O)

Avoid real filesystem in fast unit tests.

```typescript
// Create an in-memory mock of ContinuityStore
function createMockStore() {
  const data = new Map<string, any>()

  return {
    read: vi.fn(async (key: string) => {
      if (!data.has(key)) return null
      return JSON.parse(JSON.stringify(data.get(key)))  // Deep clone
    }),
    write: vi.fn(async (key: string, value: any) => {
      data.set(key, JSON.parse(JSON.stringify(value)))
    }),
    delete: vi.fn(async (key: string) => {
      data.delete(key)
    }),
    exists: vi.fn(async (key: string) => data.has(key)),
    // Test helper — peek at raw data
    _data: data,
  }
}

describe('with mock store', () => {
  it('persists delegation records', async () => {
    const store = createMockStore()
    const manager = new DelegationManager({ store })

    await manager.dispatch({ agent: 'agent-1', prompt: 'work' })

    expect(store.write).toHaveBeenCalledWith(
      'delegations',
      expect.objectContaining({
        'del-1': expect.objectContaining({ status: 'running' }),
      })
    )
  })
})
```

## Pattern 4: Mocking Timers for Async Completion

Test `completion-detector.ts` without real delays.

```typescript
describe('completion detection', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('detects completion after two signals', async () => {
    const detector = new CompletionDetector()
    const promise = detector.waitForCompletion('del-1')

    // First signal — not complete yet
    detector.signal('del-1', 'tool_returned')
    await vi.advanceTimersByTimeAsync(100)

    // Second signal — complete
    detector.signal('del-1', 'session_ended')

    await expect(promise).resolves.toBeDefined()
  })

  it('times out after configured duration', async () => {
    const detector = new CompletionDetector({ timeout: 5000 })
    const promise = detector.waitForCompletion('del-1')

    vi.advanceTimersByTime(5000)

    await expect(promise).rejects.toThrow('[Harness]')
  })
})
```

## Pattern 5: Partial Mocking with `importActual`

Keep real implementations for most exports, mock only specific ones.

```typescript
vi.mock('../lib/continuity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/continuity')>()

  return {
    ...actual,
    // Only mock the write method — keep read real
    write: vi.fn(actual.write),
  }
})
```

## Pattern 6: Mocking Environment Variables

```typescript
describe('with test env', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('respects custom state directory', () => {
    vi.stubEnv('OPENCODE_HARNESS_STATE_DIR', '/tmp/test-state')

    const config = loadConfig()
    expect(config.stateDir).toBe('/tmp/test-state')
  })

  it('uses default state directory when not set', () => {
    const config = loadConfig()
    expect(config.stateDir).toBe('.hivemind/state')
  })
})
```

## Pattern 7: Mocking Global Objects

```typescript
describe('with stubbed globals', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('handles fetch-based notification', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ delivered: true }),
    }))

    await sendNotification('del-1', 'completed')

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/notify'),
      expect.objectContaining({ method: 'POST' })
    )
  })
})
```

## Pattern 8: Mock Function Call Verification

Verify delegation arguments precisely.

```typescript
it('passes correct agent config to delegation', async () => {
  const mockDispatch = vi.fn().mockResolvedValue('del-1')

  await mockDispatch({
    agent: 'gsd-code-reviewer',
    prompt: 'Review src/lib/helpers.ts',
    temperature: 0.3,
    tools: ['Read', 'Grep', 'Glob'],
  })

  expect(mockDispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      agent: 'gsd-code-reviewer',
      tools: expect.arrayContaining(['Read', 'Grep']),
    })
  )

  // Verify exact call structure
  const [call] = mockDispatch.mock.calls
  expect(call[0]).toMatchObject({
    agent: 'gsd-code-reviewer',
    temperature: 0.3,
  })
})
```

## Anti-Patterns to Avoid

```typescript
// ❌ Don't mock what you're testing
vi.mock('../lib/helpers')  // Then test helpers — useless!

// ✅ Mock dependencies, test the unit
vi.mock('../lib/session-api')  // Mock external dependency
// Test helpers using the mocked dependency

// ❌ Don't use `any` in mocks
const mock = vi.fn() as any

// ✅ Type your mocks
const mock = vi.fn<(id: string) => Promise<Result>>()

// ❌ Don't forget to clean up
vi.mock('something')  // Leaks across tests

// ✅ Always clean up
beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.restoreAllMocks())
```

---

*Mocking patterns derived from harness architecture: CQRS tools, dual-layer state, delegation pipeline, and SDK wrappers.*
