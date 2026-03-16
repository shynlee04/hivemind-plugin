# src/hooks/start-work/ — Session Entry Orchestrator

The **real** session lifecycle system. This is where purpose classification, lineage resolution, readiness gates, trajectory assessment, and control-plane gating happen.

## Boundary

| File | Purpose |
|------|---------|
| `start-work-router.ts` | Main orchestrator — heaviest hook (~467 tokens compressed) |
| `purpose-classifier.ts` | Classifies user intent into `PurposeClass` |
| `session-state-detector.ts` | Detects session state from runtime bindings |
| `readiness-gates.ts` | Checks runtime prerequisites before session start |
| `start-work-types.ts` | `StartWorkDecision`, `PurposeClass`, `SessionStateKind` |

## Key Types

- `PurposeClass`: `discovery`, `brainstorming`, `research`, `planning`, `implementation`, `gatekeeping`, `tdd`, `course-correction`
- `SessionStateKind`: classifies runtime state for routing decisions
- `StartWorkDecision`: 25+ field aggregate of all session entry decisions

> [!IMPORTANT]
> This module is the authoritative session lifecycle — NOT `core/session/`. Any session-related work must use types and functions from here.

## Lifecycle Contract

- `start-work/` decides entry routing only.
- It may recommend or require control-plane actions, but it does not create runtime invocation records or turn-output records.
- Entry, runtime invocation, and turn completion must stay distinct so workflow and trajectory layers can govern them separately.
