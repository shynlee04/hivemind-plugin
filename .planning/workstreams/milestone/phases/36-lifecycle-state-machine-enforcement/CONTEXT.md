---
phase: 36-lifecycle-state-machine-enforcement
priority: P0
status: partial
completion_note: "PH36-01 (transition guards) and PH36-03 (PTY split) implemented. PH36-02 (activity tracking) remains."
created: 2026-04-30
depends_on: [35-event-tracker-fix-dead-code-cleanup]
blocks: [37-async-result-harvesting, 39-auto-loop-ralph-loop-engine, 11-clean-architecture-restructuring]
gsd_agents: [gsd-executor, gsd-verifier, gsd-code-reviewer]
requirements: [PH36-01, PH36-02, PH36-03]
---

# Phase 36: Lifecycle State Machine Enforcement

## Goal

Enforce lifecycle state machine transitions in `lifecycle-manager.ts`, implement activity tracking, and split `delegation-manager.ts` (currently ~656 LOC) under the 500 LOC project limit.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| PH36-01 | Replace stub `isValidTransition()` (always returns `true`) with proper `SessionLifecyclePhase` transition guards | Phase 11 rescoping |
| PH36-02 | Implement `noteObservedActivity()` for session activity tracking | Phase 11 rescoping |
| PH36-03 | Extract PTY-specific delegation logic from `delegation-manager.ts` to reduce under 500 LOC | Architecture rule (max 500 LOC) |

## Scope

- `src/lib/lifecycle-manager.ts` — real transition guards
- `src/lib/delegation-manager.ts` — extract PTY delegation to new module
- Tests for both

## GSD Routing

| Requirement | GSD Agent | Skill |
|-------------|-----------|-------|
| PH36-01 | gsd-executor | hm-test-driven-execution |
| PH36-02 | gsd-executor | hm-test-driven-execution |
| PH36-03 | gsd-executor | hm-refactor |

## Key Files

- `src/lib/lifecycle-manager.ts` (~152 LOC stub)
- `src/lib/delegation-manager.ts` (~656 LOC — needs split)
- `src/lib/types.ts` — SessionLifecyclePhase enum

## Tech Compliance

- TypeScript strict mode, ES2022, NodeNext
- Max 500 LOC per module
- No circular dependencies
- `[Harness]` prefix on all thrown errors
- Deep-clone-on-read in continuity store

## Constraints

- RED-first TDD for all changes
- Atomic scoped commits
- Full test suite must pass after each change
