# SOLID Principles

SOLID principles adapted for TypeScript implementation in the HiveMind/OpenCode ecosystem. Each principle includes definition, anti-pattern example, correct example, and HiveMind-specific guidance.

## Table of Contents

- [Single Responsibility Principle](#single-responsibility-principle)
- [Open/Closed Principle](#openclosed-principle)
- [Liskov Substitution Principle](#liskov-substitution-principle)
- [Interface Segregation Principle](#interface-segregation-principle)
- [Dependency Inversion Principle](#dependency-inversion-principle)
- [HiveMind Integration](#hivemind-integration)

---

## Single Responsibility Principle

**Definition:** A module, class, or function should have one, and only one, reason to change. In practice, this means functions should do one thing and do it well — ≤50 lines, ≤10 cyclomatic complexity.

### Bad Example

```typescript
// This tool does TOO MUCH — validates, transforms, writes, and notifies
export default tool({
  description: 'Manage tasks',
  args: {
    action: tool.schema.enum(['create', 'complete']),
    title: tool.schema.string(),
  },
  async execute(args, context) {
    // Validation
    if (!args.title || args.title.length < 3) {
      throw new Error('Title too short');
    }
    // Transform
    const slug = args.title.toLowerCase().replace(/\s+/g, '-');
    // Write
    const task = { id: crypto.randomUUID(), title: args.title, slug, done: false };
    await writeToFile('tasks.json', task);
    // Notify
    await client.tui.showToast({ message: `Task created: ${task.title}` });
    return JSON.stringify(task);
  }
});
```

### Good Example

```typescript
// Each function has ONE responsibility
function validateTaskTitle(title: string): void {
  if (!title || title.length < 3) {
    throw new Error('Title too short');
  }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-');
}

export default tool({
  description: 'Manage tasks',
  args: {
    action: tool.schema.enum(['create', 'complete']),
    title: tool.schema.string(),
  },
  async execute(args, context) {
    validateTaskTitle(args.title);
    const task = { id: crypto.randomUUID(), title: args.title, slug: slugify(args.title), done: false };
    await writeToFile('tasks.json', task);
    return JSON.stringify(task);
  }
});
```

### HiveMind Guidance

- Tool files ≤300 lines (constitution). If approaching 300, split into multiple tools.
- Each exported function ≤50 lines. If longer, extract helper functions.
- One reason to change: if a function handles both validation AND persistence, it has two reasons to change.

---

## Open/Closed Principle

**Definition:** Software entities should be open for extension but closed for modification. Add new behavior by composing or implementing interfaces, not by editing existing code.

### Bad Example

```typescript
// Adding a new notification type requires MODIFYING this function
function notify(type: string, message: string) {
  if (type === 'toast') {
    client.tui.showToast({ message });
  } else if (type === 'log') {
    client.app.log({ message, level: 'info' });
  }
  // Adding 'email' means editing this function — violates OCP
}
```

### Good Example

```typescript
interface Notifier {
  notify(message: string): Promise<void>;
}

class ToastNotifier implements Notifier {
  async notify(message: string): Promise<void> {
    client.tui.showToast({ message });
  }
}

class LogNotifier implements Notifier {
  async notify(message: string): Promise<void> {
    client.app.log({ message, level: 'info' });
  }
}

// Adding EmailNotifier = new file, no modification to existing code
async function notify(notifier: Notifier, message: string) {
  await notifier.notify(message);
}
```

### HiveMind Guidance

- Use interfaces to define contracts between layers (tool → hook → plugin).
- When adding a new tool behavior, create a new tool file — don't bloat existing tools.
- Plugin hooks are naturally OCP-compliant — add hooks without modifying existing ones.

---

## Liskov Substitution Principle

**Definition:** Subtypes must be substitutable for their base types without altering the correctness of the program. If a function works with a base type, it must work with any subtype.

### Bad Example

```typescript
interface DataStore {
  save(key: string, value: unknown): Promise<void>;
  get(key: string): Promise<unknown>;
}

// Violation: ReadOnlyStore.get throws if key doesn't exist, but DataStore.get returns undefined
class ReadOnlyStore implements DataStore {
  async save(_key: string, _value: unknown): Promise<void> {
    throw new Error('Read-only store'); // Violates LSP — callers don't expect this
  }
  async get(key: string): Promise<unknown> {
    const val = this.cache.get(key);
    if (!val) throw new Error('Not found'); // Different contract than base
    return val;
  }
}
```

### Good Example

```typescript
interface ReadableStore {
  get(key: string): Promise<unknown | undefined>;
}

interface WritableStore extends ReadableStore {
  save(key: string, value: unknown): Promise<void>;
}

class ReadOnlyStore implements ReadableStore {
  async get(key: string): Promise<unknown | undefined> {
    return this.cache.get(key); // Same contract as base — returns undefined if missing
  }
}
```

### HiveMind Guidance

- Hooks must be substitutable — a hook that throws unexpectedly breaks LSP.
- Tool context objects must behave consistently across all tools.
- When extending SDK types, preserve the original contract.

---

## Interface Segregation Principle

**Definition:** Clients should not be forced to depend on interfaces they don't use. Prefer many small, focused interfaces over one large, general-purpose interface.

### Bad Example

```typescript
// Forces all implementors to handle ALL operations, even if they only need one
interface TaskOperations {
  create(title: string): Promise<Task>;
  complete(id: string): Promise<Task>;
  delete(id: string): Promise<void>;
  assign(id: string, userId: string): Promise<Task>;
  archive(id: string): Promise<void>;
  export(id: string): Promise<string>;
}
```

### Good Example

```typescript
interface TaskReader {
  get(id: string): Promise<Task | undefined>;
  list(filter?: TaskFilter): Promise<Task[]>;
}

interface TaskWriter {
  create(title: string): Promise<Task>;
  complete(id: string): Promise<Task>;
}

interface TaskDeleter {
  delete(id: string): Promise<void>;
}

// Compose as needed
type TaskManager = TaskReader & TaskWriter & TaskDeleter;
```

### HiveMind Guidance

- Tool args should be minimal — only include parameters the tool actually uses.
- Split large interfaces at the 10-field boundary (see `Interface Decomposition` in AGENTS.md).
- Use intersection types (`TypeA & TypeB`) to compose capabilities, not monolithic interfaces.

---

## Dependency Inversion Principle

**Definition:** High-level modules should not depend on low-level modules. Both should depend on abstractions. Abstractions should not depend on details — details should depend on abstractions.

### Bad Example

```typescript
// High-level tool depends directly on concrete file system implementation
import { writeFileSync, readFileSync } from 'fs';

export default tool({
  description: 'Save config',
  args: { key: tool.schema.string(), value: tool.schema.string() },
  async execute(args) {
    // Direct dependency on fs — can't swap for cloud storage, can't test without real FS
    const config = JSON.parse(readFileSync('config.json', 'utf-8'));
    config[args.key] = args.value;
    writeFileSync('config.json', JSON.stringify(config, null, 2));
    return JSON.stringify({ saved: true });
  }
});
```

### Good Example

```typescript
// Abstraction — high-level module depends on this interface
interface ConfigStore {
  read(): Promise<Record<string, string>>;
  write(config: Record<string, string>): Promise<void>;
}

// Concrete implementation — detail, not abstraction
class FileConfigStore implements ConfigStore {
  async read(): Promise<Record<string, string>> {
    const data = await fs.promises.readFile('config.json', 'utf-8');
    return JSON.parse(data);
  }
  async write(config: Record<string, string>): Promise<void> {
    await fs.promises.writeFile('config.json', JSON.stringify(config, null, 2));
  }
}

// Tool depends on abstraction, not concrete FS
export default tool({
  description: 'Save config',
  args: { key: tool.schema.string(), value: tool.schema.string(), store: tool.schema.enum(['file', 'memory']).default('file') },
  async execute(args) {
    const configStore = createStore(args.store); // Factory returns abstraction
    const config = await configStore.read();
    config[args.key] = args.value;
    await configStore.write(config);
    return JSON.stringify({ saved: true });
  }
});
```

### HiveMind Guidance

- SDK interfaces (`tool.schema`, `context`, hooks) are the abstractions — depend on them, not on custom reimplementations.
- When a tool needs external services (file system, API, database), define an interface in the tool and implement it in a separate adapter file.
- Testing: abstractions enable mock implementations without stubbing the SDK.

---

## HiveMind Integration

### SOLID × Code Quality

| Principle | Code Quality Metric | Threshold |
|-----------|-------------------|-----------|
| Single Responsibility | Function length | ≤50 lines |
| Single Responsibility | Cyclomatic complexity | ≤10 |
| Open/Closed | Modification count | Zero edits to existing files for new features |
| Liskov Substitution | Contract consistency | All subtypes match base contract |
| Interface Segregation | Interface field count | ≤10 fields per core interface |
| Dependency Inversion | Import depth | No direct imports from infrastructure layer |

### SOLID × HiveMind Layers

| Layer | Primary SOLID Principles |
|-------|------------------------|
| Tools | SRP (one tool, one concern), DIP (depend on SDK abstractions) |
| Hooks | ISP (minimal hook interfaces), LSP (hooks must be substitutable) |
| Plugin | OCP (extend via new hooks/tools, don't modify assembly) |
| Shared | DIP (utilities depend on abstractions, not concrete types) |

### When to Apply

1. **During implementation:** Check SRP as you write each function. If it's >50 lines or handles multiple concerns, split it.
2. **During refactoring:** Apply OCP and DIP when extracting interfaces or adding new behavior.
3. **During review:** Check ISP and LSP when evaluating interface design and subtype correctness.
4. **During architecture decisions:** Consult `hivemind-architecture` for structural choices that affect SOLID compliance.
