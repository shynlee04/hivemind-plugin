# Pattern Selection Decision Tree

## Goal

Choose the smallest architecture pattern that satisfies boundary, change-rate, and integration needs.

## IF/THEN Tree

1. **IF** the codebase is a single deployable unit and the main problem is dependency direction, **THEN** start with Clean Architecture.
2. **IF** the system needs adapters for multiple delivery mechanisms (CLI, HTTP, jobs) but domain rules stay central, **THEN** choose Hexagonal Architecture.
3. **IF** business language, aggregates, and bounded contexts drive most change, **THEN** choose Domain-Driven Design.
4. **IF** more than one branch appears valid, **THEN** keep the simpler outer pattern and add DDD only to the domain layer.

## Quick Selection Table

| Signal | Clean Architecture | Hexagonal | DDD |
| --- | --- | --- | --- |
| Pain is dependency sprawl | Best fit | Good fit | Overkill unless domain is complex |
| Many adapters around one core | Good fit | Best fit | Good fit |
| Domain language and invariants dominate | Good fit | Good fit | Best fit |
| Team needs explicit ports/adapters | Okay | Best fit | Secondary |
| Team needs bounded contexts | Weak | Weak | Best fit |

## TypeScript Snapshots

### Clean Architecture

```ts
export interface UserRepository {
  save(user: User): Promise<void>
}

export class RegisterUser {
  constructor(private readonly repo: UserRepository) {}
  execute(input: RegisterUserInput) {
    return this.repo.save(User.create(input))
  }
}
```

### Hexagonal Architecture

```ts
export interface BillingPort {
  charge(invoice: Invoice): Promise<ChargeReceipt>
}

export class BillingService {
  constructor(private readonly billing: BillingPort) {}
  settle(invoice: Invoice) {
    return this.billing.charge(invoice)
  }
}
```

### Domain-Driven Design

```ts
export class OrderAggregate {
  private status: 'draft' | 'paid' = 'draft'

  pay() {
    if (this.status === 'paid') throw new Error('already-paid')
    this.status = 'paid'
  }
}
```

## Combination Rule

- Use **Clean Architecture + DDD** when the domain is rich and delivery mechanisms are stable.
- Use **Hexagonal + DDD** when adapters vary quickly and domain invariants are critical.
- Avoid mixing all three everywhere. Apply the richer pattern only where complexity earns it.

## Verification Prompts

- Which layer owns the business rule?
- Which dependency points inward?
- Which adapter may be replaced without touching domain code?
- Which aggregate protects an invariant that tests must enforce?
