# src/core/trajectory/ — Trajectory Authority

## Responsibilities
- Own trajectory state, checkpoints, resume targets, recovery outcomes, and cross-session bindings.
- Act as the authoritative relational frame for workflow, task, delegation, and planning projections.

## Owned Failures
- Missing or corrupt trajectory ledger
- Invalid active/last-closed trajectory pointers
- Missing checkpoint or resume-target continuity
- Session-first inference that bypasses trajectory attachment

## Mutation Boundary
- May mutate trajectory ledgers, checkpoints, recovery logs, and planning references.
- Must not infer authority from sessions alone when workflow or task bindings are missing.

## Contracts
- Inbound: start-work assessment, command execution, recovery, governance projection
- Outbound: trajectory assessment, resume targets, checkpoint data, projection refs
