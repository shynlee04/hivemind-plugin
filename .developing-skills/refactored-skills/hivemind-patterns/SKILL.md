---
name: hivemind-patterns
description: Architecture patterns reference — Clean Architecture, CQRS, design patterns, and anti-patterns for structural decisions.
parent: use-hivemind
---

# hivemind-patterns

## Table of Contents

- [Load Position](#load-position)
- [When You Need This](#when-you-need-this)
- [Clean Architecture](#clean-architecture)
  - [The Four Layers](#the-four-layers)
  - [The Dependency Rule](#the-dependency-rule)
  - [Practical Check](#practical-check)
- [CQRS](#cqrs)
  - [The Hard Boundary](#the-hard-boundary)
  - [Why It Matters](#why-it-matters)
  - [When to Use It](#when-to-use-it)
  - [When NOT to Use It](#when-not-to-use-it)
  - [Anti-Pattern: The Leaky Command](#anti-pattern-the-leaky-command)
- [Design Patterns](#design-patterns)
  - [Strategy](#strategy)
  - [Observer](#observer)
  - [Factory](#factory)
  - [Decorator](#decorator)
  - [Repository](#repository)
- [Anti-Pattern Catalog](#anti-pattern-catalog)
  - [God Component](#god-component)
  - [God Function](#god-function)
  - [Dead Code](#dead-code)
  - [Zombie Code](#zombie-code)
  - [Tight Coupling](#tight-coupling)
  - [Primitive Obsession](#primitive-obsession)
- [Architecture Patterns](#architecture-patterns)
  - [When to Load](#when-to-load)
- [Pattern Selection Decision Tree](#pattern-selection-decision-tree)
  - [The Golden Rule](#the-golden-rule)
- [Bundled Resources](#bundled-resources)
- [References](#references)

## Load Position
Layer: Depth. Requires `use-hivemind` (entry router) loaded first.

## When You Need This
- You're designing a new system or module and don't know how to structure it
- You're reviewing code and something feels off but you can't name it
- You're choosing between approaches and need a mental model
- You're refactoring and want to avoid introducing new problems
- You're onboarding to a codebase and want to understand its architecture

## Clean Architecture

The dependency rule is everything: source code dependencies must point inward, toward higher-level policies.

### The Four Layers

**Entities** — Core business objects and rules. They know nothing about the outside world. No imports from use cases, no awareness of databases or HTTP. If the framework dies tomorrow, entities survive.

**Use Cases** — Application-specific business rules. They orchestrate the flow of data to and from entities. They define *what* the system does, never *how* it delivers it.

**Interface Adapters** — Controllers, presenters, gateways. They convert data from the format most convenient for use cases to the format most convenient for some external agency (like a database or web API).

**Frameworks & Drivers** — The outermost layer. Databases, web frameworks, UI, external interfaces. This layer is where details live. Details change. Keep them out of your business rules.

### The Dependency Rule
```
Frameworks → Adapters → Use Cases → Entities
         (always inward, never outward)
```
A use case should never import from a controller. An entity should never know a use case exists. If you see an import going outward, you have an architectural violation.

### Practical Check
Ask: "If I swapped the database, how many files change?" If the answer is more than 1-2 adapter files, your dependencies are leaking.

## CQRS

Command Query Responsibility Segregation — separate the write path from the read path completely.

### The Hard Boundary
- **Command side**: accepts intent, validates, mutates state, emits events. Returns acknowledgment, not data.
- **Query side**: reads state, projects it, returns views. Never mutates anything.

### Why It Matters
Commands and queries have fundamentally different optimization needs. Commands need validation, consistency, audit trails. Queries need speed, caching, denormalization. Forcing them through one model gives you the worst of both.

### When to Use It
- Domain complexity is high (many business rules around writes)
- Read patterns differ significantly from write patterns
- You need to scale reads and writes independently
- Event sourcing is on the table

### When NOT to Use It
- Simple CRUD with minimal business logic
- Small team that can't maintain two models
- The complexity overhead exceeds the benefit

### Anti-Pattern: The Leaky Command
A command handler that returns rich data. If your `CreateOrder` command returns the full order with calculated fields, you've blurred the boundary. Commands return status. Queries return data.

## Design Patterns

### Strategy
**When**: You have a family of algorithms that need to be interchangeable at runtime.

```
// Not this:
if (type === 'csv') { /* 50 lines */ }
else if (type === 'json') { /* 50 lines */ }
else if (type === 'xml') { /* 50 lines */ }

// This:
const exporter = strategyRegistry.get(type);
exporter.export(data);
```

**Trade-off**: Adds abstraction. Worth it when you have 3+ variants or expect new ones. Overkill for 2 stable variants.

### Observer
**When**: Multiple objects need to react to state changes without tight coupling.

**Use it for**: Event systems, UI reactivity, logging, metrics.

**Avoid it when**: The notification chain becomes hard to debug. If you can't trace who's listening and what they do, you've built a black box.

### Factory
**When**: Object creation logic is complex or varies by type/config.

**Simple Factory**: `createParser(format)` — a function that returns the right instance.
**Abstract Factory**: When you need families of related objects (e.g., `createTheme()` returns consistent button, input, card styles).

**Trade-off**: Hides complexity but also hides behavior. Document what your factory produces.

### Decorator
**When**: You need to add behavior to objects without modifying their class.

**Good for**: Cross-cutting concerns (logging, caching, retries) layered on a core implementation.

**Watch out**: Decorator chains become unreadable past 3-4 layers. If your `CachedLoggedRetryingAuthenticatedClient` wraps 5 things, decompose.

### Repository
**When**: You need to abstract data access behind a domain-friendly interface.

**The pattern**: `OrderRepository.findById(id)` instead of `SELECT * FROM orders WHERE id = ?`.

**Critical rule**: The repository interface lives in the domain layer. The implementation lives in the infrastructure layer. Never reverse this.

## Anti-Pattern Catalog

### God Component
A single component/module that does everything. 500+ lines, 20+ imports, handles routing AND business logic AND data access.

**How to spot it**: Open the file. Scroll. If you're still scrolling at line 200 and haven't found a clear boundary, it's a god component.

**How to fix**: Extract by responsibility. One concern per module. Use dependency injection to wire them.

### God Function
A single function that's 100+ lines, has 10+ parameters, or handles 5+ distinct responsibilities.

**The test**: Can you name it with a single verb phrase? If you need "and" in the name ("validateAndTransformAndSaveAndNotify"), it's a god function.

**How to fix**: Extract functions until each does one thing. The original function becomes a coordinator that calls the extracted pieces.

### Dead Code
Code that exists but is never executed or imported. It's not dangerous, but it's noise that increases cognitive load.

**How to spot it**: Code coverage reports. Grep for usages. If nothing imports it, it's dead.

**How to fix**: Delete it. Git remembers. If you need it back, `git log` will find it.

### Zombie Code
Code that *looks* alive — it's imported, it runs — but it does nothing useful. It returns defaults, passes through inputs unchanged, or implements a feature that was removed months ago.

**How to spot it**: Functions that always return the same value regardless of input. Logic branches that never execute. Comments like "// TODO: remove this later" from 6 months ago.

**How to fix**: Trace the actual output. If the function's return value is never used meaningfully, kill it.

### Tight Coupling
Module A directly instantiates and depends on Module B's concrete implementation. Changing B breaks A.

**How to spot it**: `new ConcreteService()` scattered everywhere instead of using an interface. Import chains that span 5+ files.

**How to fix**: Introduce an interface. Inject dependencies. Depend on abstractions, not concretions.

### Primitive Obsession
Using raw strings, numbers, and booleans to represent domain concepts.

```
// Bad:
function processOrder(status: string, amount: number) { ... }

// Good:
function processOrder(status: OrderStatus, amount: Money) { ... }
```

**Why it hurts**: No compile-time validation. `processOrder("shiped", -50)` compiles fine. Domain types catch these errors.

## Pattern Selection Decision Tree

```
Is the problem about object creation?
├── Yes → Is creation logic complex or variable?
│   ├── Yes → Factory or Builder
│   └── No → Direct instantiation is fine
└── No → Is the problem about behavior variation?
    ├── Yes → Do variants need to swap at runtime?
    │   ├── Yes → Strategy
    │   └── No → Conditional or polymorphism
    └── No → Is the problem about communication between objects?
        ├── Yes → Is it one-to-many notification?
        │   ├── Yes → Observer or Event Bus
        │   └── No → Mediator
        └── No → Is the problem about adding behavior?
            ├── Yes → Decorator or Middleware
            └── No → Step back. Maybe it's not a pattern problem.
                     Maybe you need to split the module first.
```

### The Golden Rule
If you can't articulate the problem clearly, you don't need a pattern yet. You need to understand the problem better. Patterns are solutions. Start with the problem.

## Architecture Patterns

When designing new systems or evaluating existing architecture, load the architecture patterns reference for detailed pattern comparisons, trade-off analysis, and selection guidance.

### When to Load
| Condition | Load Reference |
|-----------|---------------|
| Designing a new system | architecture-patterns.md |
| Evaluating microservice boundaries | architecture-patterns.md |
| Comparing architecture approaches | architecture-patterns.md |

## Bundled Resources

| Resource | Path | Purpose |
|----------|------|---------|
| Anti-Pattern Catalog | `references/anti-pattern-catalog.md` | Comprehensive catalog of architectural anti-patterns |
| Pattern Catalog | `references/pattern-catalog.md` | Design and architecture pattern reference |
| Pattern Decision | `templates/pattern-decision.md` | Template for pattern selection decisions |
| Architecture Patterns | `references/architecture-patterns.md` | Architecture pattern catalog with selection guide |

## References

- Robert C. Martin, *Clean Architecture* (2017)
- Martin Fowler, *Patterns of Enterprise Application Architecture* (2002)
- Eric Evans, *Domain-Driven Design* (2003)
- Gang of Four, *Design Patterns* (1994)
