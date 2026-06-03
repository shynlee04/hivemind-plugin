# Mocking & Spying API — `vi`

> The `vi` object (aliased as `vitest`) is the primary utility for mocking and spying.

## Import

```typescript
import { vi } from 'vitest'
// Or with globals: true — vi is available globally
```

---

## Mock Functions

### `vi.fn(implementation?)`

Creates a standalone mock function with full call tracking.

```typescript
const fn = vi.fn()
fn('hello')
expect(fn).toHaveBeenCalledWith('hello')

// With implementation
const adder = vi.fn((a: number, b: number) => a + b)
expect(adder(2, 3)).toBe(5)
```

### `vi.spyOn(object, method, accessType?)`

Wraps an existing object method, tracking calls while executing original by default.

```typescript
const market = { getApples: () => 100 }
const spy = vi.spyOn(market, 'getApples')

market.getApples()
expect(spy).toHaveBeenCalled()
expect(spy).toHaveReturnedWith(100)

// Override implementation
spy.mockReturnValue(50)
expect(market.getApples()).toBe(50)

// Spy on getters/setters
vi.spyOn(obj, 'prop', 'get')
vi.spyOn(obj, 'prop', 'set')
```

---

## Mock Function Control Methods

```typescript
const fn = vi.fn()

// Set implementation
fn.mockImplementation((arg) => arg.toUpperCase())
fn.mockImplementationOnce((arg) => arg + '!')    // One-time override
fn.withImplementation(impl, callback)              // Temporary override

// Set return values
fn.mockReturnValue(42)                // Always return 42
fn.mockReturnValueOnce('first')       // Return 'first' once, then fallback
fn.mockResolvedValue(data)            // Return Promise.resolve(data)
fn.mockResolvedValueOnce(data)        // One-time resolved value
fn.mockRejectedValue(error)           // Return Promise.reject(error)
fn.mockRejectedValueOnce(error)       // One-time rejection

// Reset
fn.mockClear()        // Clear calls/results, keep implementation
fn.mockReset()        // Clear everything including implementation
fn.mockRestore()      // Restore original implementation (spyOn only)
```

---

## Module Mocking

### `vi.mock(path, factory?)`

Replaces a module's exports. **Calls are hoisted to file top** regardless of placement.

```typescript
// Basic — auto-mocks all exports as vi.fn()
vi.mock('../lib/helpers')

// With factory — provide custom exports
vi.mock('../lib/helpers', () => ({
  formatResponse: vi.fn(() => ({ ok: true })),
  handleError: vi.fn(),
}))

// Async factory
vi.mock('../lib/database', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, connect: vi.fn() }
})
```

### `vi.doMock(path, factory?)`

Non-hoisted version — can be used conditionally inside tests.

```typescript
it('conditionally mocks', () => {
  vi.doMock('../lib/config', () => ({ debug: true }))
  // Must re-import after doMock
})
```

### `vi.hoisted(fn)`

Defines variables that are hoisted alongside `vi.mock` — allows references inside mock factories.

```typescript
const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}))

vi.mock('../api/client', () => ({
  fetch: mockFetch,
}))
```

### `vi.importActual(path)`

Import the original, un-mocked module. Used inside `vi.mock` factory.

```typescript
vi.mock('../lib/continuity', async (importOriginal) => {
  const actual = await importActual<typeof import('../lib/continuity')>()
  return {
    ...actual,
    persistState: vi.fn(),  // Only mock this one export
  }
})
```

### `vi.importMock(path)`

Import the mocked module's type information.

```typescript
const mockedModule = await vi.importMock<typeof import('../lib/continuity')>('../lib/continuity')
```

---

## Timer Control

```typescript
// Enable fake timers
vi.useFakeTimers()
vi.useFakeTimers({ shouldAdvanceTime: true })
vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval'] })

// Advance time
vi.advanceTimersByTime(ms)           // Move forward by ms
vi.advanceTimersToNextTimer()        // Advance to next scheduled timer
vi.advanceTimersToNextFrame()        // Advance to next animation frame (requestAnimationFrame)

// Run timers
vi.runAllTimers()                     // Run all pending timers
vi.runOnlyPendingTimers()             // Run only timers created after useFakeTimers()
vi.runAllTicks()                      // Run all microtasks

// System time
vi.setSystemTime(date)               // Set Date.now() to specific time
vi.setSystemTime()                    // Reset to real time

// Timer tick modes (4.x)
vi.setTimerTickMode('manual')         // Don't auto-advance
vi.setTimerTickMode('nextTimerAsync') // Advance to next timer async
vi.setTimerTickMode('interval')       // Auto-advance intervals

// Cleanup
vi.clearAllTimers()                   // Remove all scheduled timers
vi.useRealTimers()                    // Restore original timers
```

---

## Environment Stubs

```typescript
// Global variables
vi.stubGlobal('fetch', mockFetch)
vi.stubGlobal('window', { location: { href: 'http://test' } })

// Environment variables
vi.stubEnv('NODE_ENV', 'test')
vi.stubEnv('API_KEY', 'test-key')

// Restore
vi.unstubAllGlobals()
vi.unstubAllEnvs()
```

---

## Cleanup

```typescript
vi.restoreAllMocks()      // Restore all spy implementations
vi.clearAllMocks()        // Clear all mock call data
vi.resetAllMocks()        // Full reset — clear + remove implementations
vi.resetModules()         // Clear module registry (for re-importing)
```

---

## Utility

```typescript
vi.waitFor(fn, options?)             // Wait for fn to succeed (poll)
vi.waitUntil(fn, options?)           // Wait for fn to return truthy
vi.setConfig(configOverrides)        // Temporarily change test config
vi.resetConfig()                     // Restore original config
vi.mockFakeLogFile(path?)            // Mock vitest reporter log files
```

---

*Source: Vitest 4.x API docs, Context7 `/vitest-dev/vitest`, DeepWiki*
