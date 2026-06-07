# Assertions API — `expect()`

> Vitest provides a Jest-compatible assertion API with Chai underpinnings.

## Import

```typescript
import { expect } from 'vitest'
// Or with globals: true — no import needed
```

## Identity

```typescript
expect(value).toBe(expected)              // Strict equality (===)
expect(value).toEqual(expected)           // Deep equality
expect(value).toStrictEqual(expected)     // Deep equality + checks undefined, sparseness, type
```

## Truthiness

```typescript
expect(value).toBeTruthy()                // Coerced to true
expect(value).toBeFalsy()                 // Coerced to false
expect(value).toBeNull()                  // === null
expect(value).toBeUndefined()             // === undefined
expect(value).toBeDefined()               // !== undefined
```

## Numbers

```typescript
expect(n).toBeGreaterThan(n2)
expect(n).toBeGreaterThanOrEqual(n2)
expect(n).toBeLessThan(n2)
expect(n).toBeLessThanOrEqual(n2)
expect(n).toBeCloseTo(float, numDigits?)  // Float comparison
expect(n).toBeNaN()
expect(n).toBeFinite()
expect(n).toBePositive()
expect(n).toBeNegative()
expect(n).toBeInteger()
```

## Strings

```typescript
expect(str).toContain(substring)
expect(str).toMatch(regexOrString)
expect(str).toHaveLength(n)
```

## Arrays & Iterables

```typescript
expect(arr).toContain(item)               // Same reference
expect(arr).toContainEqual(item)          // Deep equality check
expect(arr).toHaveLength(n)
expect(arr).toHaveProperty(path)          // path: 'a.b' or ['a', 'b']
expect(arr).toBeInstanceOf(Constructor)
```

## Exceptions

```typescript
expect(fn).toThrow()                      // Any error
expect(fn).toThrowError(messageOrRegex)   // Specific error
expect(fn).toThrowError(ErrorClass)       // Error class match
```

## Objects

```typescript
expect(obj).toHaveProperty(path, value?)  // path can be dot-notation or array
expect(obj).toMatchObject(subset)         // Partial deep match
expect(obj).toBeInstanceOf(Constructor)
```

## Snapshots

```typescript
expect(value).toMatchSnapshot()           // External snapshot file
expect(value).toMatchSnapshot('name')     // Named snapshot
expect(value).toMatchInlineSnapshot(`...`) // Inline in test file
expect(value).toThrowErrorMatchingSnapshot()
expect(value).toThrowErrorMatchingInlineSnapshot(`...`)
```

## Mock Assertions

```typescript
expect(mockFn).toHaveBeenCalled()                           // Called at least once
expect(mockFn).toHaveBeenCalledTimes(n)                     // Called exactly n times
expect(mockFn).toHaveBeenCalledWith(...args)               // Called with exact args
expect(mockFn).toHaveBeenLastCalledWith(...args)           // Last call args
expect(mockFn).toHaveBeenNthCalledWith(n, ...args)         // Nth call args
expect(mockFn).toHaveReturned()                             // Returned at least once
expect(mockFn).toHaveReturnedTimes(n)                       // Returned exactly n times
expect(mockFn).toHaveReturnedWith(value)                    // Returned specific value
expect(mockFn).toHaveLastReturnedWith(value)                // Last return value
expect(mockFn).toHaveNthReturnedWith(n, value)              // Nth return value
```

## Promises

```typescript
await expect(promise).resolves.toBe(value)     // Promise resolves to value
await expect(promise).resolves.toEqual(value)
await expect(promise).rejects.toThrow()        // Promise rejects with error
await expect(promise).rejects.toThrowError(msg)
```

## Asymmetric Matchers

```typescript
expect.any(Constructor)              // Any instance of Constructor
expect.anything()                     // Any non-null/undefined value
expect.arrayContaining(items)         // Array containing subset
expect.objectContaining(subset)       // Object with at least these props
expect.stringContaining(substring)    // String containing substring
expect.stringMatching(regexOrStr)     // String matching regex
expect.closeTo(number, numDigits?)    // Float close to number
expect.assertNot(parsedAssertion)     // Negate parsed assertion
```

## Modifiers

```typescript
expect(value).not.toBe(expected)      // Negation — inverts assertion
expect.soft(value).toBe(expected)     // Soft assertion — continues on failure
await expect.poll(fn).toBe(expected)  // Poll until passes or times out
```

## Custom Matchers

```typescript
// In setupFiles:
expect.extend({
  toBeFoo(received, expected) {
    const pass = received === 'foo'
    return {
      message: () => `expected ${received} to be foo`,
      pass,
    }
  },
})

// Usage:
expect('foo').toBeFoo()
expect({ foo: 'foo' }).toEqual({ foo: expect.toBeFoo() })  // Asymmetric
```

## Accessing Mock Call Data

```typescript
const fn = vi.fn()
fn('hello', 'world')

fn.mock.calls         // [['hello', 'world']] — all call arguments
fn.mock.results       // [{ type: 'return', value: ... }] — all return values
fn.mock.instances     // [thisArg] — `this` contexts
fn.mock.contexts      // [thisArg] — same as instances (clearer name)
fn.mock.lastCall      // ['hello', 'world'] — last call args
fn.mock.reset()       // Clear all mock data
fn.mock.clear()       // Clear calls/results but keep implementation
```

---

*Source: Vitest 4.x API docs, Context7 `/vitest-dev/vitest`, DeepWiki*
