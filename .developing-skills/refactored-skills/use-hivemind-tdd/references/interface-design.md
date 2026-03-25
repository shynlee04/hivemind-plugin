# Interface Design for Testability

## Rules

### 1. Accept Dependencies, Don't Create Them

```typescript
// Good: caller controls the dependency
processOrder(order, paymentGateway)

// Bad: function creates its own dependency internally
processOrder(order) // internally: new PaymentGateway()
```

Dependency injection makes testing trivial — pass a real or test implementation without any mocking framework.

### 2. Return Results, Don't Produce Side Effects

```typescript
// Good: pure function, easy to test
calculateDiscount(cart): Discount

// Bad: side effect, hard to test in isolation
applyDiscount(cart): void
```

Functions that return values are deterministic and composable. Functions that produce side effects require setup, teardown, and ordering concerns in tests.

### 3. Small Surface Area

- **Fewer methods** = fewer tests needed to cover the contract.
- **Fewer params** = simpler test setup, fewer combinations to exercise.

```typescript
// Good: minimal surface
interface PaymentGateway {
  charge(amount: number, token: string): Result
}

// Bad: bloated surface, many test paths
interface PaymentGateway {
  charge(amount: number, token: string, currency: string, metadata: object, retry: boolean, timeout: number): Result
  validateToken(token: string): boolean
  refund(transactionId: string, amount: number): Result
  getHistory(filter: object): Transaction[]
  updateConfig(config: object): void
}
```

## Deep Modules

A module is **deep** when it has a small interface but rich implementation:

| Quality | Interface | Implementation | Example |
|---------|-----------|----------------|---------|
| Good | Small | Deep | `checkout(cart, payment) → Order` |
| Bad | Large | Shallow | 12 methods, each 3 lines |

Deep modules are easy to test because:
- Fewer public methods to cover.
- Complexity is hidden inside, where tests don't need to reach.
- Changes to implementation don't ripple to tests.

## Interface Segregation

Split large interfaces into role-specific ones:

```typescript
// Good: clients depend only on what they use
interface OrderReader {
  findById(id: string): Order
}

interface OrderWriter {
  save(order: Order): void
}

// Bad: every client sees everything
interface OrderRepository {
  findById(id: string): Order
  save(order: Order): void
  delete(id: string): void
  findByUser(userId: string): Order[]
  countByStatus(status: string): number
}
```

## Summary

| Principle | Test Benefit |
|-----------|-------------|
| Accept dependencies | No mocking frameworks needed |
| Return results | Deterministic assertions |
| Small surface | Fewer test cases |
| Deep modules | Tests don't break on refactors |
| Interface segregation | Focused, isolated tests |
