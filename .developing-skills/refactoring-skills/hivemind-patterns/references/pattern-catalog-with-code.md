# Pattern Catalog With Code

## SOLID Snapshots

### Single Responsibility Principle

```ts
export class InvoiceCalculator {
  total(lines: InvoiceLine[]) {
    return lines.reduce((sum, line) => sum + line.amount, 0)
  }
}

export class InvoiceFormatter {
  toMarkdown(total: number) {
    return `# Invoice\n\nTotal: ${total}`
  }
}
```

### Open/Closed Principle

```ts
interface DiscountPolicy {
  apply(total: number): number
}

class SeasonalDiscount implements DiscountPolicy {
  apply(total: number) {
    return total * 0.9
  }
}
```

### Dependency Inversion Principle

```ts
interface EventPublisher {
  publish(topic: string, payload: unknown): Promise<void>
}

class OrderNotifier {
  constructor(private readonly publisher: EventPublisher) {}
}
```

## Selection Hints

| Problem | Pattern |
| --- | --- |
| Many interchangeable behaviors | Strategy |
| One object coordinates subsystems | Facade |
| Need to decouple senders from receivers | Observer / PubSub |
| Need protected construction rules | Factory |
| Need reversible actions | Command |

## IF/THEN Routing

1. **IF** behavior varies by rule set, **THEN** prefer Strategy.
2. **IF** callers suffer from too many subsystem details, **THEN** add a Facade.
3. **IF** one class switches on `type` repeatedly, **THEN** consider Factory or polymorphism.
4. **IF** state changes must be logged or undone, **THEN** evaluate Command.

## Anti-Pattern Warning

- Do not add patterns to hide poor naming.
- Do not create abstractions until at least two behaviors compete.
- Do not use Observer when a direct call is enough.
