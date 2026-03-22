# src/core/trajectory/ — Trajectory State & Assessment

Manages the trajectory ledger — the persistent record of session trajectories, events, checkpoints, and recovery logs.

## Boundary

| File | Purpose |
|------|---------|
| `trajectory-store.ts` | Ledger CRUD — bootstrap, record events, close, checkpoint |
| `trajectory-assessment.ts` | Entry assessment — decides attach/resume/create/defer/refuse |
| `trajectory-types.ts` | `TrajectoryRecord` (20+ fields), `TrajectoryLedger`, assessment types |

## Design

- Ledger persists in `.hivemind/state/trajectory-ledger.json`
- Trajectory records track sessions, workflows, tasks, events, checkpoints
- Assessment determines whether to attach to active, resume closed, or create new
- Recovery outcomes feed back via `recordTrajectoryRecoveryOutcome()`
- Exposed to agents via `hivemind_trajectory` tool
- **User consent**: Tool execution requires `context.ask()` for writes; automatic trajectory operations are internal state management

## Audit Note

> [!WARNING]
> `TrajectoryRecord` has 20+ fields. Most are optional arrays (delegationIds, graphNodeBindings, rerouteNotes, branchNotes) that are rarely populated. Consider splitting into core record + optional extensions.
