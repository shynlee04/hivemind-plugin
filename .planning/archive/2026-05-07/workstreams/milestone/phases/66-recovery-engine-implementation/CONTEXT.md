---
phase: 66-recovery-engine-implementation
priority: P1
status: pending
created: 2026-04-30
depends_on:
  - 56-trajectory-and-session-v3
  - 38-q6-state-root-migration
blocks: []
gsd_agents:
  - gsd-executor
  - gsd-verifier
requirements:
  - REC-01
  - REC-02
  - REC-03
  - REC-04
---

# Phase 66: Recovery Engine Implementation

## Goal

Implement the recovery engine with 9 failure classes, recovery state assessment, checkpoint creation, and state repair capabilities.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| REC-01 | 9 failure classes — classify all known failure modes for the harness | product-detox recovery |
| REC-02 | assessRecoveryState — evaluate current session for recovery needs | product-detox recovery |
| REC-03 | createRecoveryCheckpoint — persist recovery point for session resumption | product-detox recovery |
| REC-04 | repairRecoveryState — fix corrupted or inconsistent state | product-detox recovery |

## Scope

- New `src/lib/recovery/` directory
- New `src/lib/recovery-engine.ts`
- Tests in `tests/lib/recovery/`

## GSD Routing

| Requirement | GSD Agent | Skill |
|-------------|-----------|-------|
| REC-01 | gsd-executor | hm-l2-test-driven-execution |
| REC-02 | gsd-executor | hm-l2-test-driven-execution |
| REC-03 | gsd-verifier | hm-l2-test-driven-execution |
| REC-04 | gsd-verifier | hm-l2-test-driven-execution |

## Key Files

- `src/lib/recovery/index.ts`
- `src/lib/recovery/failure-classes.ts`
- `src/lib/recovery/assess-state.ts`
- `src/lib/recovery/create-checkpoint.ts`
- `src/lib/recovery/repair-state.ts`
- `src/lib/recovery-engine.ts`

## Tech Compliance

- TypeScript strict mode, ES2022, NodeNext
- Max 500 LOC per module
- No circular dependencies
- All state writes to `.hivemind/` (Q6)
- CQRS: tools are write-side, hooks are read-side

## Dependencies

- Phase 56: Trajectory and session v3 (trajectory checkpoints)
- Phase 38: Q6 state root migration (`.hivemind/` state root)

## Constraints

- RED-first TDD for all source changes
- Atomic scoped commits
- Full test suite must pass after each change
- No direct code copy from product-detox — concept extraction only
- Source reference: product-detox `src/recovery/` (~200 LOC)
