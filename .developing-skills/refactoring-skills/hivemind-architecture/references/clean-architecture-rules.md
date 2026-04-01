# Clean Architecture Rules

42 rules organized by layer. These rules govern all structural decisions in the HiveMind ecosystem.

## Entity Rules (Rules 1–7)

Entities encode business rules and domain invariants. They are the innermost layer and know nothing about the outside world.

### Rule 1: Zero External Dependencies

**Description:** Entity files must not import from any other layer. No framework imports, no database imports, no I/O imports.

**Violation Example:**
```typescript
// entity/trajectory.ts
import { Database } from 'some-orm' // WRONG: entity depends on infrastructure
```

**Fix:** Remove the import. The entity defines the data structure and invariants only. Persistence is handled by adapters.

### Rule 2: Pure Domain Logic Only

**Description:** Entity methods contain only business rules. No side effects, no logging, no network calls, no file system access.

**Violation Example:**
```typescript
class Task {
  complete() {
    this.status = 'done'
    fetch('/api/notify', { method: 'POST' }) // WRONG: side effect in entity
  }
}
```

**Fix:** The entity returns the state change. The use case or adapter handles the side effect.

### Rule 3: No Framework Annotations

**Description:** Entity classes must not carry framework-specific decorators, annotations, or metadata.

**Violation Example:**
```typescript
@Entity({ tableName: 'tasks' }) // WRONG: ORM decorator on entity
class Task { ... }
```

**Fix:** Use a separate persistence model in the adapter layer. Map between entity and persistence model.

### Rule 4: Immutable Value Objects

**Description:** Entities use value objects for identity and typed attributes. Value objects are compared by value, not reference.

**Violation Example:**
```typescript
// Using raw strings for typed identifiers
const taskId: string = 'abc-123' // WRONG: no type safety
```

**Fix:** Define a branded type or value object class for domain identifiers.

### Rule 5: Domain Events from Entities

**Description:** When an entity state change is significant, the entity produces a domain event. The entity does not publish it — it returns it.

**Violation Example:**
```typescript
class Workflow {
  activate() {
    this.status = 'active'
    EventBus.publish(new WorkflowActivated(this.id)) // WRONG: entity publishes
  }
}
```

**Fix:** The entity returns the event. The use case publishes it through the appropriate channel.

### Rule 6: No Conditional Logic Based on Caller

**Description:** Entity behavior must not change based on who is calling. The same input always produces the same output.

**Violation Example:**
```typescript
class Contract {
  approve(approver: string) {
    if (approver === 'admin') this.status = 'auto-approved' // WRONG: caller-dependent
  }
}
```

**Fix:** Make the approval rules explicit in the entity. Different use cases invoke different entity methods.

### Rule 7: Self-Validation

**Description:** Entities validate their own invariants. An entity never allows itself to be in an invalid state.

**Fix:** Validate in the constructor and in every mutation method. Throw domain-specific errors for violations.

---

## Use Case Rules (Rules 8–14)

Use cases orchestrate business workflows. They depend on entities and interface abstractions. They never depend on concrete adapters.

### Rule 8: Single Responsibility per Use Case

**Description:** Each use case handles exactly one business operation. No "god use case" that does everything.

**Violation Example:**
```typescript
class ManageWorkflow {
  create() { ... }
  activate() { ... }
  complete() { ... }
  delete() { ... }
}
```

**Fix:** Split into `CreateWorkflow`, `ActivateWorkflow`, `CompleteWorkflow`, `DeleteWorkflow`.

### Rule 9: Depend on Interfaces, Not Implementations

**Description:** Use cases import interface types from the domain layer. They never import concrete adapter classes.

**Violation Example:**
```typescript
import { PostgresTaskRepo } from '../adapters/postgres-task-repo' // WRONG
```

**Fix:** Define `ITaskRepository` in the domain layer. The use case depends on the interface.

### Rule 10: Orchestration, Not Business Logic

**Description:** Use cases coordinate between entities and adapters. They do not contain business rules — those live in entities.

**Violation Example:**
```typescript
class CompleteTask {
  execute(taskId: string) {
    if (task.dependencies.every(d => d.complete)) { // WRONG: rule in use case
      task.complete()
    }
  }
}
```

**Fix:** Move the dependency check into the entity. The use case calls `task.completeIfReady()`.

### Rule 11: Input Validation at the Boundary

**Description:** Use cases validate input at entry. Invalid input never reaches entities.

**Fix:** Use Zod schemas (tool.schema) at the tool boundary. The use case receives pre-validated input.

### Rule 12: No Direct I/O

**Description:** Use cases never perform I/O directly. No HTTP calls, no file reads, no database queries. All I/O goes through adapter interfaces.

**Violation Example:**
```typescript
class CreateWorkflow {
  async execute() {
    const result = await fetch('/api/workflows', ...) // WRONG: direct HTTP
  }
}
```

**Fix:** Inject an `IWorkflowGateway` interface. The adapter implements the HTTP call.

### Rule 13: Transaction Boundaries Explicit

**Description:** Use cases define transaction boundaries explicitly. No implicit transactions spanning multiple adapter calls.

**Fix:** Use the Unit of Work pattern. The use case opens a transaction, performs operations, and commits or rolls back.

### Rule 14: Return Domain Types

**Description:** Use cases return domain types or simple DTOs. They never return framework-specific types (HTTP responses, ORM models).

**Violation Example:**
```typescript
return new ResponseEntity(task, HttpStatus.OK) // WRONG: framework type
```

**Fix:** Return the entity or a plain DTO. The adapter converts to the framework type.

---

## Adapter Rules (Rules 15–21)

Adapters implement interfaces defined by use cases. They translate between external formats and domain formats.

### Rule 15: Implement Domain Interfaces

**Description:** Every adapter implements an interface defined in the use case or domain layer. The adapter never defines its own interface that the domain must follow.

**Fix:** Define `ITaskRepository` in domain. `PostgresTaskRepository` implements it in the adapter layer.

### Rule 16: Translate, Don't Leak

**Description:** Adapters translate between external and domain formats. External types never leak into the domain layer.

**Violation Example:**
```typescript
return rawDatabaseRow // WRONG: returns DB-specific type
```

**Fix:** Map the database row to a domain entity before returning.

### Rule 17: One Adapter per External System

**Description:** Each external system (database, API, file system) gets its own adapter. No adapter handles multiple external systems.

**Fix:** Separate `PostgresTaskRepo`, `RedisCacheAdapter`, `S3FileStorage` — one each.

### Rule 18: Error Translation

**Description:** Adapters translate external errors into domain errors. Domain code never sees database-specific exceptions.

**Violation Example:**
```typescript
throw new PostgresError('connection lost') // WRONG: leaks DB error
```

**Fix:** Catch the external error and throw a domain error: `throw new InfrastructureError('Persistence unavailable')`.

### Rule 19: Configuration Injection

**Description:** Adapters receive configuration through constructor injection. They never read environment variables or config files directly.

**Violation Example:**
```typescript
const host = process.env.DB_HOST // WRONG: adapter reads env directly
```

**Fix:** Inject `{ host: string, port: number }` through the constructor.

### Rule 20: No Business Logic

**Description:** Adapters contain zero business logic. They only perform translation, routing, and I/O.

**Violation Example:**
```typescript
class TaskRepo {
  save(task: Task) {
    if (task.priority === 'high') { ... } // WRONG: business logic in adapter
  }
}
```

**Fix:** Move the priority logic into the entity or use case. The adapter just saves.

### Rule 21: Swappable by Default

**Description:** Any adapter can be replaced with an alternative implementation without changing the use case or entity code. This is the primary test of good adapter design.

**Fix:** If replacing the adapter requires changing the use case, the adapter boundary is wrong.

---

## Framework Rules (Rules 22–28)

Frameworks, drivers, and UI are the outermost layer. They depend inward. Nothing depends on them.

### Rule 22: Framework Is a Plugin

**Description:** The framework is a detail that can be replaced. The core business logic must work without any specific framework.

**Fix:** All framework-specific code stays in the framework layer. Use dependency inversion to keep the core framework-agnostic.

### Rule 23: No Framework Types in Domain

**Description:** Domain and use case code must not reference framework types.

**Violation Example:**
```typescript
import { Request, Response } from 'express' // WRONG: framework type in use case
```

**Fix:** Define domain request/response types. The adapter maps between framework and domain types.

### Rule 24: Configuration in Framework Layer

**Description:** All configuration loading, environment variable reading, and secret management happens in the framework layer.

**Fix:** The framework layer reads config and injects it into adapters and use cases through constructors.

### Rule 25: Routing Is Framework Concern

**Description:** URL routing, HTTP method mapping, and request parsing are framework responsibilities. They are not business logic.

**Fix:** Define routes in the framework layer. Each route handler calls a use case.

### Rule 26: Serialization at the Boundary

**Description:** JSON serialization, XML conversion, and protocol-specific formatting happen only at the framework boundary.

**Fix:** Domain types are serialized by the framework adapter, never by the domain itself.

### Rule 27: Test Framework Independence

**Description:** Core tests must pass without the framework. If a domain test requires Express, NestJS, or any framework, the boundary is violated.

**Fix:** Mock adapter interfaces in use case tests. Entities need no mocks at all.

### Rule 28: Lifecycle Management

**Description:** Startup, shutdown, and lifecycle hooks belong to the framework layer. Use cases and entities are unaware of application lifecycle.

**Fix:** Framework code handles graceful shutdown. It notifies adapters, which clean up resources. Use cases are stateless.

---

## Cross-Cutting Rules (Rules 29–42)

### Rule 29: Dependency Direction Inward

Dependencies always point inward. Outer layers depend on inner layers. Inner layers never depend on outer layers.

### Rule 30: Interface Segregation per Layer

Interfaces are defined at the layer that consumes them, not the layer that implements them. Use cases define repository interfaces. Adapters implement them.

### Rule 31: No Circular Dependencies

If module A depends on module B, module B must not depend on module A. Use events or interfaces to break cycles.

### Rule 32: Cross-Cutting Concerns via Interception

Logging, authentication, and metrics are implemented as cross-cutting interceptors, not mixed into business logic.

### Rule 33: Error Bubbling with Context

Errors bubble upward (from inner to outer layers). Each layer adds context. The outermost layer decides how to present the error.

### Rule 34: One Direction of Data Flow

Data flows inward on the way down (request) and outward on the way up (response). No bidirectional data flow within a single call.

### Rule 35: Explicit State Transitions

State transitions are explicit and named. No implicit state changes through property mutation.

### Rule 36: No Global State

No global variables, singletons, or static mutable state. All state is injected or passed as parameters.

### Rule 37: Testability per Layer

Each layer must be testable in isolation. Entities need no mocks. Use cases need interface mocks. Adapters need infrastructure mocks.

### Rule 38: Coupling Metrics

Afferent coupling (Ca) — how many modules depend on this one — should be high for stable modules. Efferent coupling (Ce) — how many modules this one depends on — should be low for stable modules.

### Rule 39: No God Modules

No module may exceed 300 lines of code. No function may exceed 50 lines. No class may have more than 10 public methods.

### Rule 40: Dependency Inversion for Cross-Layer Communication

When an inner layer needs something from an outer layer, define an interface in the inner layer. The outer layer implements it. The inner layer never imports from the outer layer.

### Rule 41: Event-Driven for Async Boundaries

Cross-module communication across process boundaries uses events, not synchronous calls. Events are defined in the domain layer.

### Rule 42: Architecture Fitness Functions

Every architectural rule should be verifiable by an automated test. These tests are architecture fitness functions. They run in CI and fail the build on violations.

---

*This catalog is referenced by the SKILL.md Clean Architecture Quick Reference section. Load this file when reviewing architecture compliance or making structural decisions.*
