# src/recovery/ — Checkpointed Recovery Spine

## Responsibilities
- Detect recoverable vs blocked runtime failures.
- Create checkpoints, propose resume targets, dedupe repeated repairs, and perform targeted repair actions.
- Reconstruct continuity from trajectory/workflow/task state instead of replaying sessions.

## Owned Failures
- Missing or corrupt `.hivemind` runtime roots
- Missing or corrupt trajectory ledgers
- Missing workflow/task ledgers
- Recovery loops without dedupe guards

## Mutation Boundary
- May create checkpoints and recovery outcomes.
- May repair trajectory/workflow state and write recovery artifacts.
- Must not act as a long-term source of truth for workflow or task ownership.

## Contracts
- Inbound: recovery command handlers, harness checks, doctor/init bootstrap
- Outbound: recovery assessment, repair actions, resume targets, checkpoint ids
