# Pattern Catalog Reference

## 1. Strategy Pattern

**When to use:**
- Multiple algorithms exist for the same task
- Algorithm selection happens at runtime
- You want to avoid conditional logic for algorithm selection
- Algorithms are interchangeable without changing the client

**Structure:**
```typescript
interface SortStrategy {
  sort<T>(data: T[], compare: (a: T, b: T) => number): T[];
}

class QuickSort implements SortStrategy {
  sort<T>(data: T[], compare: (a: T, b: T) => number): T[] {
    // quicksort implementation
  }
}

class MergeSort implements SortStrategy {
  sort<T>(data: T[], compare: (a: T, b: T) => number): T[] {
    // mergesort implementation
  }
}

class Sorter {
  constructor(private strategy: SortStrategy) {}
  setStrategy(strategy: SortStrategy) { this.strategy = strategy; }
  sort<T>(data: T[], compare: (a: T, b: T) => number): T[] {
    return this.strategy.sort(data, compare);
  }
}
```

**Trade-offs:**
- PRO: Open/Closed — add new strategies without modifying client
- CON: Class explosion — one class per strategy
- CON: Client must know which strategy to select

**Anti-pattern risk:** If only 2 algorithms exist and never change, a simple if/else may suffice.

---

## 2. Observer Pattern

**When to use:**
- One object changes state and multiple dependents need notification
- Publisher doesn't need to know who subscribes
- Loose coupling between state change and reactions

**Structure:**
```typescript
interface Observer<T> {
  update(data: T): void;
}

class EventEmitter<T> {
  private observers: Observer<T>[] = [];

  subscribe(observer: Observer<T>): () => void {
    this.observers.push(observer);
    return () => {
      this.observers = this.observers.filter(o => o !== observer);
    };
  }

  notify(data: T): void {
    for (const observer of this.observers) {
      observer.update(data);
    }
  }
}
```

**Trade-offs:**
- PRO: Decoupled — publisher doesn't know subscribers
- PRO: Dynamic — add/remove observers at runtime
- CON: Notification order may be unpredictable
- CON: Memory leaks if observers aren't unsubscribed
- CON: Debugging is harder (indirect control flow)

**Anti-pattern risk:** Circular dependencies between observer and subject.

---

## 3. Factory Pattern

**When to use:**
- Object creation is complex (multiple steps, configuration)
- Creation logic varies by type/condition
- Client shouldn't know concrete class
- Same creation logic used in multiple places

**Structure:**
```typescript
interface Connection {
  connect(): void;
  query(sql: string): Promise<Row[]>;
  close(): void;
}

interface ConnectionFactory {
  create(config: ConnectionConfig): Connection;
}

class PostgresConnectionFactory implements ConnectionFactory {
  create(config: ConnectionConfig): Connection {
    return new PostgresConnection(config);
  }
}

class MongoConnectionFactory implements ConnectionFactory {
  create(config: ConnectionConfig): Connection {
    return new MongoConnection(config);
  }
}
```

**Trade-offs:**
- PRO: Hides creation complexity from client
- PRO: Easy to add new types
- PRO: Centralized creation logic
- CON: Added abstraction layer
- CON: Factory itself can become a God class

**Anti-pattern risk:** Abstract Factory for only one product type.

---

## 4. Decorator Pattern

**When to use:**
- Add behavior to objects without modifying their class
- Behavior should be combinable at runtime
- Inheritance would create too many subclasses
- You need to wrap objects transparently

**Structure:**
```typescript
interface Logger {
  log(message: string): void;
}

class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(message);
  }
}

abstract class LoggerDecorator implements Logger {
  constructor(protected wrapped: Logger) {}
  abstract log(message: string): void;
}

class TimestampDecorator extends LoggerDecorator {
  log(message: string): void {
    const timestamp = new Date().toISOString();
    this.wrapped.log(`[${timestamp}] ${message}`);
  }
}

class LevelDecorator extends LoggerDecorator {
  constructor(wrapped: Logger, private level: string) {
    super(wrapped);
  }
  log(message: string): void {
    this.wrapped.log(`[${this.level}] ${message}`);
  }
}

// Usage: decorators compose
const logger = new LevelDecorator(
  new TimestampDecorator(
    new ConsoleLogger()
  ),
  'INFO'
);
```

**Trade-offs:**
- PRO: Flexible composition at runtime
- PRO: Single Responsibility — each decorator does one thing
- PRO: Open/Closed — add decorators without modifying wrapped class
- CON: Many small objects
- CON: Order of decoration matters
- CON: Hard to debug deep decorator chains

**Anti-pattern risk:** Decorator that modifies the interface instead of just adding behavior.

---

## 5. Repository Pattern

**When to use:**
- Business logic shouldn't know data access details
- You want to swap data sources (DB, API, mock) easily
- Testing requires mocking data access
- Multiple data sources serve the same domain

**Structure:**
```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

class PostgresUserRepository implements UserRepository {
  constructor(private pool: Pool) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return row ? mapToUser(row) : null;
  }

  async save(user: User): Promise<void> {
    await this.pool.query(
      'INSERT INTO users (id, email, name) VALUES ($1, $2, $3)',
      [user.id, user.email, user.name]
    );
  }

  // ... other methods
}

class InMemoryUserRepository implements UserRepository {
  private store = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null;
  }

  async save(user: User): Promise<void> {
    this.store.set(user.id, user);
  }

  // ... other methods
}
```

**Trade-offs:**
- PRO: Clean separation of data access from business logic
- PRO: Easy to swap implementations (DB → API → mock)
- PRO: Testable — inject mock repository
- CON: Extra abstraction layer
- CON: Can hide important DB-specific optimizations
- CON: "Leaky abstraction" if queries get complex

**Anti-pattern risk:** Generic repository that tries to abstract all possible queries (use query objects instead).

---

## Pattern Selection Quick Reference

| Pattern | Use When | Avoid When |
|---------|----------|------------|
| Strategy | Multiple interchangeable algorithms | Only 2 fixed algorithms |
| Observer | 1-to-many state notifications | Direct callback would suffice |
| Factory | Complex or varied object creation | Simple `new` is enough |
| Decorator | Combinable behavior additions | Inheritance hierarchy is small |
| Repository | Swappable data access layer | Single, fixed data source |
