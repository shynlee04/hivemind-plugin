# Architecture Patterns

Reference catalog of system-level architecture patterns. Each pattern includes trade-off analysis to support informed structural decisions. For design-level patterns (Strategy, Observer, etc.), see the parent SKILL.md.

---

## Layered Architecture

A structural pattern that organizes code into horizontal layers with strict dependency direction. Each layer provides services to the layer above it and consumes services from the layer below.

### The Four Tiers

| Tier | Responsibility | Key Rule |
|------|---------------|----------|
| **Presentation** | UI, controllers, API endpoints | Depends on Application only |
| **Application** | Use cases, orchestration, workflow | Depends on Domain only |
| **Domain** | Business entities, rules, invariants | Depends on nothing |
| **Infrastructure** | Databases, queues, external APIs | Implements Domain interfaces |

Dependencies flow downward. The domain tier has zero external dependencies. Infrastructure implements interfaces defined in the domain tier — it never defines them.

### When to Use

- Small-to-medium systems with clear domain boundaries
- Teams that need a simple, enforceable structure
- Applications where the domain model is relatively stable
- Migration targets for legacy systems that need gradual restructuring

### Trade-offs

| What You Gain | What You Lose |
|---------------|---------------|
| Clear separation of concerns | Flexibility at layer boundaries |
| Easy to understand and onboard | Can lead to "sink" models crossing all layers |
| Testable in isolation per layer | Performance overhead from layer translation |
| Simple dependency rule to enforce | Horizontal scaling requires additional patterns |

### HiveMind Conventions

HiveMind's own layer architecture follows this pattern: tools (write-side) correspond to the Application tier, hooks (read-side) map to Presentation and Infrastructure interception, and the schema kernel serves as the Domain tier. The CQRS boundary in HiveMind is a strict instance of layered separation.

---

## Event-Driven Architecture

A pattern where system components communicate through events — immutable records of something that happened. Producers emit events without knowledge of consumers. Consumers react to events independently.

### Core Concepts

- **Event**: An immutable fact describing something that occurred (`OrderPlaced`, `UserRegistered`)
- **Producer**: Emits events without knowing who (if anyone) will consume them
- **Consumer**: Subscribes to events and reacts asynchronously
- **Event Bus**: The middleware that routes events from producers to consumers

### Variants

| Variant | Description | Best For |
|---------|-------------|----------|
| **Simple Pub/Sub** | Fire-and-forget event distribution | Loose coupling, notifications |
| **Event Sourcing** | State is derived from the event log | Audit trails, temporal queries |
| **Event Streaming** | Ordered, replayable event logs | Real-time processing, analytics |

### When to Use

- Systems with many independent consumers of the same data changes
- Workflows that require loose coupling between steps
- Domains where audit trails and temporal queries matter
- Asynchronous processing pipelines

### Trade-offs

| What You Gain | What You Lose |
|---------------|---------------|
| Loose coupling between components | Debugging complexity (event chains) |
| Easy to add new consumers without touching producers | Eventual consistency by default |
| Natural audit trail | Schema evolution challenges |
| Independent scaling of producers and consumers | Ordering guarantees are non-trivial |

### HiveMind Conventions

HiveMind uses the OpenCode `event` hook as its event backbone. Custom event buses are explicitly forbidden (see anti-pattern catalog). The pattern applies: tools emit state-change events, hooks observe and react. No direct coupling between the write side and the reactive side.

---

## Microservices Architecture

An architectural style where the system is decomposed into small, independently deployable services, each owning a bounded context. Services communicate through well-defined APIs, not shared databases.

### Bounded Contexts

A bounded context defines the boundary within which a particular domain model applies consistently. Each microservice owns exactly one bounded context. Models that cross bounded contexts require explicit integration contracts.

### Key Principles

- **Single Responsibility**: Each service owns one business capability
- **Autonomous Deployment**: Services deploy independently
- **Data Ownership**: Each service owns its data store; no shared databases
- **API Contracts**: Services communicate through versioned APIs
- **Resilience**: Services must handle other services being unavailable

### When to Use

- Large teams (8+ developers) needing independent release cadences
- Domains with clearly separable bounded contexts
- Systems requiring independent scaling of different capabilities
- Organizations structured around service ownership

### Trade-offs

| What You Gain | What You Lose |
|---------------|---------------|
| Independent deployment and scaling | Operational complexity (service mesh, monitoring) |
| Technology diversity per service | Distributed system challenges (latency, consistency) |
| Team autonomy | Integration testing complexity |
| Fault isolation | Data consistency requires sagas or eventual consistency |

### HiveMind Conventions

HiveMind itself is a monolithic plugin, not a microservice. However, the bounded context principle applies: each tool owns its state surface, and cross-tool communication flows through the OpenCode SDK boundary, not shared mutable state. The internal sector architecture (`src/tools/`, `src/hooks/`, `src/core/`) applies microservice-like ownership rules within the monolith.

---

## CQRS and Event Sourcing

CQRS (Command Query Responsibility Segregation) separates the write model from the read model. Event Sourcing persists state as a sequence of immutable events rather than mutable snapshots. The parent SKILL.md covers the CQRS hard boundary in detail; this section addresses implementation-level patterns.

### Implementation Patterns

**Command Side**:
- Commands carry intent (not data mutations) — `CreateOrder`, not `SetOrderStatusToCreated`
- Validation happens before state mutation
- Each successful command produces one or more events
- The command handler returns acknowledgment only, never rich data

**Query Side**:
- Read models are projections built from events
- Projections can be denormalized for query performance
- Multiple projections can serve different query needs from the same event stream
- Projections are rebuildable — they are derived state, not source of truth

**Event Store**:
- Append-only log of domain events
- Events are immutable once written
- The event log is the source of truth
- Snapshots optimize replay performance for long-lived aggregates

### When to Use

- Domains with complex write validation and simple read needs (or vice versa)
- Systems requiring full audit history
- Collaborative domains where conflict resolution matters
- Read and write workloads differ by orders of magnitude

### Trade-offs

| What You Gain | What You Lose |
|---------------|---------------|
| Optimized read and write paths independently | System complexity doubles (two models) |
| Complete audit trail by default | Eventual consistency between write and read sides |
| Ability to rebuild any projection from events | Storage grows continuously without compaction |
| Natural fit for temporal queries | Learning curve for teams unfamiliar with the pattern |

### HiveMind Conventions

HiveMind enforces CQRS as a constitutional rule: tools own writes, hooks are read-only. The event sourcing aspect is reflected in the trajectory system — state transitions are recorded as immutable events, and the current state is a projection over those events.

---

## Hexagonal Architecture (Ports and Adapters)

A structural pattern where the application core is isolated from external concerns through ports (interfaces) and adapters (implementations). The core defines what it needs; adapters provide how those needs are met.

### Core Concepts

- **Application Core**: Pure business logic with zero external dependencies
- **Ports**: Interfaces defined by the core that describe what it needs (driven ports) or what it provides (driving ports)
- **Driven Adapters**: Implementations of ports that connect the core to infrastructure (databases, queues, APIs)
- **Driving Adapters**: Components that invoke the core (controllers, CLI handlers, event listeners)

### When to Use

- Systems that must support multiple infrastructure backends
- Domains where business logic must be testable in complete isolation
- Applications undergoing infrastructure migration
- Projects requiring strict dependency inversion

### Trade-offs

| What You Gain | What You Lose |
|---------------|---------------|
| Infrastructure independence | Interface proliferation for simple systems |
| Core logic testable without any external dependency | Indirection layers add complexity |
| Easy to swap databases, queues, or APIs | Adapters must be kept in sync with port changes |
| Clear boundary between "what" and "how" | Overkill for simple CRUD applications |

### HiveMind Conventions

HiveMind's tool layer acts as the port surface: `tool.schema` defines the interface contract, and the `execute` function is the adapter implementation. The `shared/` layer provides shared port definitions, while `src/core/` implements the application core. Swapping an infrastructure detail (e.g., changing how `.hivemind/` paths are resolved) requires changing the adapter, not the core.

---

## Architecture Pattern Selection Guide

Use this decision table to narrow the architecture pattern based on domain complexity and team size. No single pattern is universally correct — the right choice depends on the specific constraints of the system.

### Decision Table

| Domain Complexity | Team Size | Recommended Pattern | Rationale |
|-------------------|-----------|-------------------|-----------|
| Low (CRUD-heavy) | Solo (1) | Layered Architecture | Simple structure, minimal overhead, easy to enforce alone |
| Low (CRUD-heavy) | Small (2-4) | Layered Architecture | Team can share layers without coordination overhead |
| Low (CRUD-heavy) | Large (5+) | Layered + Modules | Layered base with module boundaries for team ownership |
| Medium (some business rules) | Solo (1) | Hexagonal Architecture | Testability in isolation matters; ports enable future flexibility |
| Medium (some business rules) | Small (2-4) | Hexagonal or CQRS | Hexagonal for infrastructure flexibility; CQRS if read/write diverge |
| Medium (some business rules) | Large (5+) | Modular Monolith | Internal module boundaries prevent god components without distributed overhead |
| High (complex domain) | Solo (1) | CQRS + Event Sourcing | Full audit trail and temporal queries justify complexity |
| High (complex domain) | Small (2-4) | CQRS + Hexagonal | CQRS for domain complexity, hexagonal for infrastructure isolation |
| High (complex domain) | Large (5+) | Microservices or Modular Monolith | Microservices if bounded contexts are clear; modular monolith if boundaries are still forming |
| High (event-heavy workflows) | Any | Event-Driven Architecture | When the domain is naturally expressed as events, this is the right default |

### Selection Principles

1. **Start simpler than you think you need.** Upgrading from Layered to Hexagonal is straightforward. Downgrading from Microservices is painful.
2. **Domain complexity drives pattern choice more than team size.** A solo developer with a complex domain benefits from CQRS more than a large team with a simple domain.
3. **Combine patterns intentionally.** CQRS + Hexagonal is common. CQRS + Microservices is powerful but expensive. Layered + Microservices is a contradiction.
4. **Reassess at growth boundaries.** When the team doubles or the domain's bounded contexts become clear, re-evaluate. Architecture is not a one-time decision.
5. **HiveMind's position**: The framework uses Layered Architecture internally (tools/hooks/core/shared) with CQRS enforcement. It does not prescribe a single architecture for consumer projects — this guide supports informed selection.

### Anti-Pattern: Resume-Driven Architecture

Choosing an architecture pattern because it is fashionable, impressive on a resume, or used by a well-known company — not because it solves a real problem in the current system. If the team cannot articulate why they need microservices in terms of their specific domain constraints, they do not need microservices.
