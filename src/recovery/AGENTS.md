# src/recovery/ — State Assessment & Repair

Detects state failures, creates checkpoints, and repairs broken runtime state.

## Boundary

| File | Purpose |
|------|---------|
| `recovery-engine.ts` | `assessRecoveryState()`, `createRecoveryCheckpoint()`, `repairRecoveryState()` |
| `recovery-types.ts` | 9 failure classes, assessment/repair result types |

## Failure Classes

`missing-hivemind`, `missing-planning-root`, `missing-state-tasks`, `missing-graph-tasks`, `missing-trajectory-ledger`, `corrupt-trajectory-ledger`, `missing-task-link`, `unknown-task-link`, `active-trajectory-conflict`

## Design

- Recovery assessment → failure classification → repair action
- Checkpoints persist in trajectory ledger for resume capability
- Recovery outcomes feed back to trajectory store via `recordTrajectoryRecoveryOutcome()`
