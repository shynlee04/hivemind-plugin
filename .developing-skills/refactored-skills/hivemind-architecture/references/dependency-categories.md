# Dependency Categories

Taxonomy for classifying, analyzing, and managing dependencies in the HiveMind ecosystem.

## Stable vs. Volatile Dependencies

### Stable Dependencies

Stable dependencies are unlikely to change in ways that break consumers. They have mature APIs, backward-compatible release policies, and wide adoption.

**Characteristics:**
- Mature, widely-used library or SDK
- Backward-compatible release policy
- Minimal breaking changes in history
- Well-documented API surface
- Large user base (deprecation is unlikely)

**Examples:**
- Standard library (Node.js `fs`, `path`, `util`)
- Mature SDK surfaces (`tool.schema`, `client.app.log()`)
- Established utility libraries (Zod, well-maintained packages)
- Internal interfaces defined in the domain layer

**Rule:** Stable dependencies are safe to depend on. Prefer them over volatile alternatives.

### Volatile Dependencies

Volatile dependencies may change in ways that break consumers. They include early-stage libraries, external APIs, and framework-specific code.

**Characteristics:**
- Early-stage or rapidly evolving library
- External API with no stability guarantee
- Framework-specific code that may be replaced
- Internal implementation details of other modules
- Anything that requires a specific version pin

**Examples:**
- Third-party REST APIs (rate limits, auth changes, versioning)
- Database drivers (schema changes, driver updates)
- Framework-specific decorators and annotations
- Internal utilities from other modules (not public interface)
- Environment-specific configurations

**Rule:** Volatile dependencies must be isolated behind interfaces. Use dependency inversion to protect the domain.

## Dependency Categories by Layer

### Framework Dependencies

**Definition:** Dependencies on external frameworks, libraries, and SDKs that provide infrastructure.

**Location:** Framework and adapter layers only. Never in domain or use case layers.

**Examples:** Express, Zod, database drivers, HTTP clients, OpenCode SDK

**Management:**
- Pin versions explicitly
- Isolate behind adapter interfaces
- Monitor for security vulnerabilities
- Plan migration paths for major version bumps

### Domain Dependencies

**Definition:** Dependencies on domain concepts, entities, and business rules.

**Location:** Domain and use case layers. May be referenced by adapter layer (for translation).

**Examples:** Entity types, value objects, domain events, interface definitions

**Management:**
- Domain dependencies are the most stable in the system
- They should have zero external (framework, infrastructure) dependencies
- Changes to domain types ripple through use cases and adapters

### Infrastructure Dependencies

**Definition:** Dependencies on external systems, services, and resources.

**Location:** Adapter layer only. Accessed through interfaces defined in the domain layer.

**Examples:** Database connections, HTTP clients, file system, environment variables

**Management:**
- Inject through constructor parameters
- Isolate behind interfaces
- Mock in tests
- Configure through the framework layer

## Coupling Analysis Techniques

### Afferent Coupling (Ca)

**Definition:** How many other modules depend on this module.

**Interpretation:**
- High Ca = this module is depended upon by many others. It must be stable.
- Low Ca = this module is isolated. Changes have limited blast radius.

**Target:** High Ca for domain modules (they are the foundation). Low Ca for adapter modules (they should be swappable).

### Efferent Coupling (Ce)

**Definition:** How many other modules this module depends on.

**Interpretation:**
- High Ce = this module depends on many others. It is sensitive to change.
- Low Ce = this module is self-contained. It is resilient to external changes.

**Target:** Low Ce for domain modules (they should be independent). Higher Ce is acceptable for adapter modules (they integrate with external systems).

### Instability (I)

**Formula:** `I = Ce / (Ca + Ce)`

**Interpretation:**
- I ≈ 0 = maximally stable (many depend on it, it depends on nothing)
- I ≈ 1 = maximally unstable (nothing depends on it, it depends on many)

**Target:**
- Domain modules: I < 0.3 (stable foundation)
- Adapter modules: I > 0.7 (easily replaced)
- Use case modules: I ≈ 0.5 (balanced)

### Abstractness (A)

**Formula:** `A = abstract_types / total_types`

**Interpretation:**
- High A = many abstract types (interfaces, abstract classes). Flexible but potentially over-engineered.
- Low A = mostly concrete types. Rigid but straightforward.

**Target:** High A for stable modules (domain interfaces). Low A for unstable modules (adapters are concrete implementations).

### Distance from Main Sequence (D)

**Formula:** `D = |A + I - 1|`

**Interpretation:**
- D ≈ 0 = module is in the "main sequence" — well-balanced between abstractness and instability.
- D ≈ 1 = module is in a "zone of pain" (concrete + stable = hard to change) or "zone of uselessness" (abstract + unstable = no one uses it).

**Target:** D < 0.3 for all modules. Modules with D > 0.5 should be flagged for review.

## Dependency Inversion Opportunities

When to apply dependency inversion:

1. **Use case needs infrastructure** — Define an interface in the use case layer. Adapter implements it.
2. **Domain needs external data** — Define a repository interface in the domain. Adapter implements it.
3. **Module A needs Module B's data** — Define an interface for the data access. Module B's adapter implements it.
4. **Test needs isolation** — Define interfaces for all external dependencies. Mock in tests.

### Dependency Inversion Template

```typescript
// domain/interfaces.ts (INNER LAYER — defines the interface)
export interface ITaskRepository {
  findById(id: string): Promise<Task | null>
  save(task: Task): Promise<void>
}

// adapters/task-repository.ts (OUTER LAYER — implements the interface)
export class FileTaskRepository implements ITaskRepository {
  // concrete implementation using file system
}
```

### Inversion Anti-Patterns

1. **Interface in the wrong layer** — Defining the repository interface in the adapter layer instead of the domain layer. The domain should own its interfaces.
2. **Leaky abstractions** — The interface exposes implementation details (e.g., SQL-specific types in the repository interface).
3. **Over-abstraction** — Creating interfaces for dependencies that will never have a second implementation. Apply inversion when the second use case appears, not before.

## HiveMind Dependency Rules

Within the HiveMind ecosystem:

| Module | May Depend On | Must NOT Depend On |
|--------|--------------|-------------------|
| `src/tools/` | `src/core/`, `src/shared/`, `src/schema-kernel/` | Other tools, hooks |
| `src/hooks/` | `src/core/`, `src/shared/` | Tools, direct infrastructure |
| `src/plugin/` | All modules (assembly only) | Business logic |
| `src/core/` | `src/schema-kernel/` (types only) | Tools, hooks, plugin, external libs |
| `src/shared/` | SDK types, Zod | Any other internal module |
| `src/schema-kernel/` | Nothing external | Everything (most stable) |

---

*This taxonomy is referenced by the SKILL.md Dependency Analysis section. Load this file when analyzing coupling, classifying dependencies, or identifying inversion opportunities.*
