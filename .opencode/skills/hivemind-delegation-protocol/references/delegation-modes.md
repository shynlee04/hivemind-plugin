# Delegation Modes

## Sequential First
- Default to `sequential`.
- Stay sequential when one slice depends on another slice's findings.
- Stay sequential when two slices touch the same authority surface.
- Stay sequential when debugging or verification is still unresolved.

## Parallel Gate
- Parallel is allowed only when all slices are already isolated.
- Parallel is allowed only when merge-by-synthesis is safe.
- Parallel requires explicit accounting for batches or slice totals.

## Mode Fit
- `research`: use when scope is read-only and evidence is missing.
- `execution`: use when the slice is bounded enough to implement.
- `verification`: use when the output must be hard proof, not a fix.
- `planning`: use when the child should return stages, not edits.

## Required Packet Fields
- concern
- objective
- scope
- out_of_scope
- execution_mode
- constraints
- success_metrics
- return_contract
- return_gate
