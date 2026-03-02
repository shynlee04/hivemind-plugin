# Skill: hitea-property-testing

# Property-Based Testing with fast-check

Use when implementing property-based testing for JavaScript/TypeScript applications. Triggers on: 'property testing', 'fuzzing', 'generative testing', 'fast-check', 'invariant testing'.

## What is Property-Based Testing?

Unlike example-based testing (`expect(add(1, 1)).toBe(2)`), property-based testing defines **universal invariants** that must hold for ALL inputs. The testing framework generates thousands of random inputs to find edge cases you never thought of.

```javascript
// Example-based (weak)
test('add 1 + 1', () => expect(add(1, 1)).toBe(2));

// Property-based (strong)
test('addition is commutative', () => {
  fc.assert(
    fc.property(fc.integer(), fc.integer(), (a, b) => {
      expect(add(a, b)).toBe(add(b, a));
    })
  );
});
```

## Core Concepts

### 1. Invariants (Properties)
Invariants are statements that must ALWAYS be true:
- **Commutativity**: `add(a, b) === add(b, a)`
- **Identity**: `add(a, 0) === a`
- **Associativity**: `add(add(a, b), c) === add(a, add(b, c))`
- **Idempotency**: `sort(sort(list)) === sort(list)`
- **Round-trip**: `decode(encode(x)) === x`

### 2. Arbitraries (Generators)
Arbitraries generate random values:

| Arbitrary | Generates |
|-----------|-----------|
| `fc.integer()` | All integers (including edge cases) |
| `fc.string()` | Random strings (including unicode) |
| `fc.array(fc.integer())` | Arrays of integers |
| `fc.record({ a: fc.string() })` | Objects with specific shape |
| `fc.constantFrom('a', 'b', 'c')` | One of specified values |
| `fc.tuple(fc.integer(), fc.string())` | Tuples |

### 3. Runners
```javascript
// Basic assertion
fc.assert(fc.property(arb, predicate));

// With options
fc.assert(
  fc.property(fc.integer(), (n) => n === n),
  { numRuns: 10000, seed: 42 }
);
```

## Implementation Guide

### Step 1: Identify Invariants
Before writing tests, identify what MUST always be true:
- Mathematical properties (commutativity, associativity)
- Business rules (balance never negative)
- Data integrity (round-trip encoding)

### Step 2: Choose Arbitraries
Select generators that cover the input space:
- Use constraints (`fc.integer({ min: 0, max: 100 })`) when needed
- Combine with `fc.tuple`, `fc.record`, `fc.array`
- Use `fc.oneof` for union types

### Step 3: Write Property Tests
```javascript
import fc from 'fast-check';

describe('Cart Properties', () => {
  it('adding items increases total', () => {
    fc.assert(
      fc.property(
        fc.record({ price: fc.float({ min: 0 }), qty: fc.integer({ min: 1 }) }),
        (item) => {
          const cart = new Cart();
          const before = cart.total;
          cart.add(item);
          return cart.total >= before;
        }
      )
    );
  });

  it('discount never makes total negative', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ price: fc.float({ min: 0 }), qty: fc.integer({ min: 1 }) })),
        fc.float({ min: 0, max: 1 }), // discount 0-100%
        (items, discount) => {
          const cart = new Cart();
          items.forEach(i => cart.add(i));
          cart.applyDiscount(discount);
          return cart.total >= 0;
        }
      )
    );
  });
});
```

### Step 4: Shrinking
When a test fails, fast-check automatically "shrinks" to the smallest failing case:

```
Property failed after 47 tests
{ seed: -509673267, path: "47:0:0:0:0", endOnFailure: true }
Counterexample: [{"price": 0.5, "qty": 1}, 0.999]
Shrunk 4 time(s)
Got error: Error: expect(received).toBeGreaterThanOrEqual(expected)
```

## Advanced Patterns

### State Machine Testing
For stateful systems, use model-based testing:

```javascript
const cartCommands = [
  fc.tuple(fc.constant('add'), fc.record({ price: fc.float(), qty: fc.integer() })),
  fc.tuple(fc.constant('clear'), fc.constant(undefined)),
];

fc.assert(
  fc.property(
    fc.commands(cartCommands, { maxCommands: 100 }),
    (cmds) => {
      const cart = new Cart();
      const model = { total: 0 };
      fc.modelRun(() => ({ model, real: cart }), cmds);
    }
  )
);
```

### Async Properties
```javascript
fc.assert(
  fc.asyncProperty(fc.string(), async (s) => {
    const encoded = await encode(s);
    const decoded = await decode(encoded);
    return decoded === s;
  })
);
```

### Custom Arbitraries
```javascript
const userArb = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  age: fc.integer({ min: 0, max: 120 }),
  role: fc.constantFrom('admin', 'user', 'guest'),
});

const usersArb = fc.array(userArb, { minLength: 0, maxLength: 100 });
```

## Common Invariants Reference

| Domain | Invariant | Example |
|--------|-----------|---------|
| **Math** | Commutativity | `f(a, b) === f(b, a)` |
| **Math** | Associativity | `f(f(a, b), c) === f(a, f(b, c))` |
| **Math** | Identity | `f(a, identity) === a` |
| **Data** | Round-trip | `decode(encode(x)) === x` |
| **Data** | Idempotency | `f(f(x)) === f(x)` |
| **Data** | Monotonicity | `a <= b implies f(a) <= f(b)` |
| **Collections** | Size invariant | `sort(arr).length === arr.length` |
| **Collections** | Element preservation | `sort(arr) contains same elements` |
| **Business** | Invariant preservation | `balance >= 0` always |
| **Business** | Conservation | `moneyIn - moneyOut = balance` |

## Scripts

### Generate Property Tests
```bash
# Generate property tests for a module
./scripts/generate-property-tests.sh src/utils/calculator.ts
```

### Run with Coverage
```bash
# Run property tests with coverage
npx jest --testPathPattern="property" --coverage
```

## Templates

### Basic Property Test Template
```javascript
import fc from 'fast-check';
import { functionUnderTest } from './module';

describe('Property Tests: functionUnderTest', () => {
  it('should satisfy [INVARIANT_NAME]', () => {
    fc.assert(
      fc.property(
        // Arbitraries
        fc.INTEGER(),
        // Predicate
        (input) => {
          // Property assertion
          return true; // Replace with actual invariant
        }
      ),
      { numRuns: 1000 }
    );
  });
});
```

## References

- `references/fast-check-api.md` — Complete API reference
- `references/arbitraries-cheatsheet.md` — All built-in arbitraries
- `references/invariant-patterns.md` — Common invariant patterns by domain
