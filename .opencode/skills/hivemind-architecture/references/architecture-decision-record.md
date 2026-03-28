# Architecture Decision Records

## What Is an ADR?

An Architecture Decision Record (ADR) captures a single, significant architectural decision. It records the context that motivated the decision, the decision itself, and the consequences that follow. ADRs are immutable once accepted — they are historical documents, not living specs.

ADR files live alongside the code they affect, typically in a `docs/adr/` or `.hivemind/adr/` directory. Each ADR is numbered sequentially.

## When to Write an ADR

Write an ADR when:

- A decision affects **two or more modules** or crosses layer boundaries
- A **technology choice** constrains future options (database, messaging, framework)
- A **structural pattern** is adopted or rejected (CQRS, event sourcing, hexagonal)
- A **service boundary** is established, moved, or removed
- A **data ownership** decision is made (which service owns which data)
- An **NFR trade-off** is accepted (consistency vs availability, latency vs throughput)

Do NOT write an ADR for:

- Implementation details within a single module
- Bug fixes or refactoring decisions
- Test strategy choices (use spec-driven skill instead)
- Delegation or workflow decisions (use delegation skill instead)

## ADR Lifecycle

| Status | Description | Transition |
|--------|-------------|------------|
| **Proposed** | Under discussion, not yet ratified. Open for feedback. | → Accepted or rejected |
| **Accepted** | Ratified and in effect. The team commits to this decision. | → Deprecated or Superseded |
| **Deprecated** | No longer recommended. Still valid as historical record. | Terminal state |
| **Superseded** | Replaced by a newer ADR. Must reference the new ADR number. | Points to replacement |

### Status Transition Rules

1. A Proposed ADR may become Accepted after ratification (verbal agreement in meeting, PR approval, or explicit sign-off).
2. An Accepted ADR may become Deprecated when the team no longer follows it, but no replacement exists yet.
3. An Accepted ADR may become Superseded when a new ADR replaces it. The old ADR must reference the new one.
4. ADRs are never deleted. They remain as historical context.

## ADR Structure

Every ADR follows this structure:

```markdown
# ADR-{number}: {title}

**Status:** {Proposed|Accepted|Deprecated|Superseded}
**Date:** {YYYY-MM-DD}
**Deciders:** {list of people or roles}
**Supersedes:** {ADR-NNN, if applicable}

## Context
{What forces are at play. What is the technical or business situation.}

## Decision
{What was decided. Be specific and unambiguous.}

## Consequences
{What becomes easier or harder as a result.}

## Alternatives Considered
{What else was evaluated and why it was rejected.}
```

For the blank template, see `templates/architecture-decision.md`.

## Example ADR

---

### ADR-007: Use CQRS for Trajectory System

**Status:** Accepted
**Date:** 2026-03-15
**Deciders:** Architecture team

#### Context

The trajectory system needs to handle both real-time state writes (attach events, checkpoint transitions) and complex read queries (traverse history, filter by purpose class). These two workloads have fundamentally different optimization needs:

- **Writes** require low-latency, append-only operations with strong consistency.
- **Reads** require flexible filtering, aggregation, and temporal queries.

Combining both in a single model creates contention and forces compromises on both sides.

#### Decision

Adopt the CQRS (Command Query Responsibility Segregation) pattern for the trajectory system:

- **Command side:** Tools handle write operations. Each tool produces a validated event. Events are appended to the trajectory log.
- **Query side:** Hooks and read models handle queries. Read models are projections of the event log, optimized for specific query patterns.

This aligns with the HiveMind CQRS hard boundary: tools write, hooks read. No exceptions.

#### Consequences

**Positive:**
- Write and read paths can be optimized independently.
- The tool/hook boundary maps directly to the command/query boundary.
- Event log provides a complete audit trail.
- Read models can be rebuilt from events at any time.

**Negative:**
- Eventual consistency between writes and reads.
- More infrastructure (event storage, projection logic).
- Developers must understand which side they are working on.

#### Alternatives Considered

1. **Single model with read methods** — Simpler but creates contention. Rejected because writes and reads have incompatible optimization needs.
2. **Event sourcing without CQRS** — Events stored but queries go through the event log directly. Rejected because complex queries would require scanning the entire log.
3. **Separate databases for reads and writes** — Maximum isolation but adds operational complexity. Deferred to future evaluation if performance requires it.

---

## HiveMind-Specific ADR Guidance

Within the HiveMind ecosystem, ADRs should reference:

- **SDK surfaces** affected (tool.schema, client.*, permission.ask, etc.)
- **Layer boundaries** impacted (tools, hooks, plugin, core, shared)
- **CQRS compliance** — Does the decision maintain the write/read separation?
- **Consumer impact** — Does the decision affect npm package consumers?

When writing an ADR for a HiveMind architectural decision, include a section titled "SDK Impact" that lists affected SDK surfaces and any new internal interfaces introduced.

---

*Use `templates/architecture-decision.md` for the blank template when writing a new ADR.*
