# ADR-002: Type Decomposition Strategy

## Status
**Accepted** — 2.9.5

## Context
Several core types had grown to 17-26 fields, making them difficult to maintain, test, and reason about. Key offenders: `TrajectoryRecord` (22), `StartWorkDecision` (26), `PromptPacketState` (25), `SlashCommandBundle` (17), `CommandExecutionInput` (25), `RuntimeAttachmentSettings` (17).

## Decision
Decompose large types into **focused intersection types** grouped by concern.

## Pattern
```typescript
// Before: monolithic
interface TrajectoryRecord {
  id: string; sessionId: string; /* ...20 more fields */
}

// After: decomposed by concern
interface TrajectoryCore { id: string; status: string; /* ... */ }
interface TrajectoryBindings { sessionId: string; workflowId: string; /* ... */ }
interface TrajectoryEvidence { events: Event[]; checkpoints: Checkpoint[]; /* ... */ }
interface TrajectoryPlanning { planningPhase: string; /* ... */ }
type TrajectoryRecord = TrajectoryCore & TrajectoryBindings & TrajectoryEvidence & TrajectoryPlanning;
```

## Rationale
1. **Testability** — Tests construct only the concern group they need
2. **Readability** — Each interface is <10 fields, one screen
3. **Evolvability** — Adding a field means touching one concern group, not a monolith
4. **Documentation** — Concern groups are self-documenting by name

## Consequences
- Types defined across multiple interfaces (must be intersection-merged for full use)
- Existing consumers use the merged type transparently
- New types should follow the `Core + Bindings + Evidence + Planning` pattern
