---
name: hivemind-patterns
description: Architecture patterns reference — Clean Architecture, CQRS, design patterns, and anti-patterns for structural decisions.
---

# hivemind-patterns

## Table of Contents

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
- [Conditional Loading](#conditional-loading)
- [Bundled Resources](#bundled-resources)
- [References](#references)

**Path Parameters** (adapt to your framework):
- `{runtime_state_dir}` — Root runtime state directory (e.g., `.hivemind/`, `.claude/`, `.cursor/`)
- `{runtime_activity_dir}` — Activity artifacts directory (e.g., `.hivemind/activity/`, `.claude/activity/`)
- `{pathing_config}` — Pathing configuration file (e.g., `.hivemind/pathing/active-paths.json`)

## When You Need This
- Designing a new system or module with uncertainty about structure
- Reviewing code that feels wrong but defies easy classification
- Choosing between approaches without a clear mental model
- Refactoring while avoiding introduction of new problems
- Onboarding to a codebase that requires architectural understanding

## Clean Architecture

The dependency rule is everything: source code dependencies must point inward, toward higher-level policies.

### The Four Layers

**Entities** — Core business objects and rules. They know nothing about the outside world. No imports from use cases, no awareness of databases or HTTP. If the framework dies tomorrow, entities survive.

**Use Cases** — Application-specific business rules. They orchestrate the flow of data to and from entities. They define *what* the system does, never *how* it delivers it.

**Interface Adapters** — Controllers, presenters, gateways. They convert data from the format most convenient for use cases to the format most convenient for some external agency (like a database or web API).

**Frameworks & Drivers** — The outermost layer. Databases, web frameworks, UI, external interfaces. This layer is where details live. Details change. Keep them out of business rules.

### The Dependency Rule
```
Frameworks → Adapters → Use Cases → Entities
         (always inward, never outward)
```
A use case should never import from a controller. An entity should never know a use case exists. An import going outward is an architectural violation.

### Practical Check
Ask: "If the database were swapped, how many files change?" If the answer is more than 1-2 adapter files, dependencies are leaking.

## CQRS

Command Query Responsibility Segregation — separate the write path from the read path completely.

### The Hard Boundary
- **Command side**: accepts intent, validates, mutates state, emits events. Returns acknowledgment, not data.
- **Query side**: reads state, projects it, returns views. Never mutates anything.

### Why It Matters
Commands and queries have fundamentally different optimization needs. Commands need validation, consistency, audit trails. Queries need speed, caching, denormalization. Forcing them through one model delivers the worst of both.

### When to Use It
- Domain complexity is high (many business rules around writes)
- Read patterns differ significantly from write patterns
- Scaling reads and writes independently is required
- Event sourcing is on the table

### When NOT to Use It
- Simple CRUD with minimal business logic
- Small team that can't maintain two models
- The complexity overhead exceeds the benefit

### Anti-Pattern: The Leaky Command
A command handler that returns rich data. A `CreateOrder` command that returns the full order with calculated fields has blurred the boundary. Commands return status. Queries return data.

## Design Patterns

### Strategy
**When**: A family of algorithms needs to be interchangeable at runtime.

```
// Not this:
if (type === 'csv') { /* 50 lines */ }
else if (type === 'json') { /* 50 lines */ }
else if (type === 'xml') { /* 50 lines */ }

// This:
const exporter = strategyRegistry.get(type);
exporter.export(data);
```

**Trade-off**: Adds abstraction. Worth it when 3+ variants exist or new ones are expected. Overkill for 2 stable variants.

### Observer
**When**: Multiple objects need to react to state changes without tight coupling.

**Use it for**: Event systems, UI reactivity, logging, metrics.

**Avoid it when**: The notification chain becomes hard to debug. If tracing who is listening and what they do becomes impossible, a black box has been built.

### Factory
**When**: Object creation logic is complex or varies by type/config.

**Simple Factory**: `createParser(format)` — a function that returns the right instance.
**Abstract Factory**: When families of related objects are needed (e.g., `createTheme()` returns consistent button, input, card styles).

**Trade-off**: Hides complexity but also hides behavior. Document what the factory produces.

### Decorator
**When**: Behavior needs to be added to objects without modifying their class.

**Good for**: Cross-cutting concerns (logging, caching, retries) layered on a core implementation.

**Watch out**: Decorator chains become unreadable past 3-4 layers. A `CachedLoggedRetryingAuthenticatedClient` that wraps 5 things needs decomposition.

### Repository
**When**: Abstracting data access behind a domain-friendly interface is needed.

**The pattern**: `OrderRepository.findById(id)` instead of `SELECT * FROM orders WHERE id = ?`.

**Critical rule**: The repository interface lives in the domain layer. The implementation lives in the infrastructure layer. Never reverse this.

## Anti-Pattern Catalog

### God Component
A single component/module that does everything. 500+ lines, 20+ imports, handles routing AND business logic AND data access.

**How to spot it**: Open the file. Scroll. If still scrolling at line 200 without finding a clear boundary, it is a god component.

**How to fix**: Extract by responsibility. One concern per module. Use dependency injection to wire them.

### God Function
A single function that's 100+ lines, has 10+ parameters, or handles 5+ distinct responsibilities.

**The test**: Can it be named with a single verb phrase? If "and" appears in the name ("validateAndTransformAndSaveAndNotify"), it is a god function.

**How to fix**: Extract functions until each does one thing. The original function becomes a coordinator that calls the extracted pieces.

### Dead Code
Code that exists but is never executed or imported. It's not dangerous, but it's noise that increases cognitive load.

**How to spot it**: Code coverage reports. Grep for usages. If nothing imports it, it's dead.

**How to fix**: Delete it. Git remembers. If recovery is needed, `git log` will find it.

### Zombie Code
Code that *looks* alive — it's imported, it runs — but it does nothing useful. It returns defaults, passes through inputs unchanged, or implements a feature that was removed months ago.

**How to spot it**: Functions that always return the same value regardless of input. Logic branches that never execute. Comments like "// TODO: remove this later" from months ago.

**How to fix**: Trace the actual output. If the function's return value is never used meaningfully, remove it.

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
                     Maybe the module needs splitting first.
```

### The Golden Rule
If the problem cannot be articulated clearly, a pattern is not needed yet. Understanding the problem comes first. Patterns are solutions. Start with the problem.

## Architecture Patterns

When designing new systems or evaluating existing architecture, load the architecture patterns reference for detailed pattern comparisons, trade-off analysis, and selection guidance.

### When to Load
| Condition | Load Reference |
|-----------|---------------|
| Designing a new system | architecture-patterns.md |
| Evaluating microservice boundaries | architecture-patterns.md |
| Comparing architecture approaches | architecture-patterns.md |

## Conditional Loading

| Condition | Load Reference |
|-----------|---------------|
| Designing new system architecture | `architecture-patterns.md` |
| Evaluating existing code patterns | `pattern-catalog.md` |
| Detecting anti-patterns in codebase | `anti-pattern-catalog.md` |
| CQRS boundary decisions | `architecture-patterns.md` (CQRS section) |
| Database selection needed | `architecture-patterns.md` + `hivemind-architecture` |

## OpenCode Tool Matrix

| Pattern Question | Preferred Tool | Why |
| --- | --- | --- |
| locate candidate implementations | `grep` | fast pattern hunting |
| inspect concrete code blocks | `read` | exact implementation context |
| trace class or interface usage | `lsp.findReferences` | semantic coupling proof |
| validate current library idioms | `context7_query-docs` | up-to-date API examples |

## Concrete Bash Examples

```bash
# Search for type-based switching patterns (e.g., grep -n "switch (.*type" -n src/**/*.ts)
# Run type checking (e.g., npx tsc --noEmit for TypeScript, mypy for Python)
# Run the test suite (e.g., npm test, pytest, cargo test)
```

## Pattern Application Workflow

1. Capture the problem statement first.
2. Load `references/pattern-catalog-with-code.md` for code-backed candidate patterns.
3. Record the chosen pattern with `templates/pattern-application.json`.
4. Verify the pattern reduces complexity or coupling without changing behavior.

## Pattern Selection Decision Tree Extension

1. **IF** the pain is interchangeable behavior, **THEN** prefer Strategy.
2. **IF** callers suffer from subsystem sprawl, **THEN** prefer Facade.
3. **IF** construction rules are duplicated, **THEN** consider Factory.
4. **IF** a pattern adds indirection without removing real complexity, **THEN** reject it.

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `use-hivemind` | Entry router — triggers this skill for structural decisions |
| `use-hivemind-skill-authoring` | Domain router — when skill authoring involves pattern decisions, both load together |
| `hivemind-synthesis` | Architecture pattern validation — verifies synthesis output against architectural patterns |

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

## Activity Output

All artifacts produced by this skill follow the Activity Folder Protocol.

**Pathing:** See `{pathing_config}` for resolved output paths.
**Naming:** `{category}-{semantic-id}-{YYYY-MM-DD}.{ext}`
**Meta:** All JSON includes `_meta.created_at`, `_meta.updated_at`, `_meta.producer`.
**Validation:** Run `bash use-hivemind-delegation/scripts/hm-artifact-validate.sh {path}` to confirm compliance.
