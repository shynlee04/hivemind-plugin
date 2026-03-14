# src/governance/ — Durable Projection And Planning SOT

## Responsibilities
- Project trajectory/workflow/task/checkpoint state into readable planning and governance artifacts.
- Separate transient recovery/handoff state from durable planning references.

## Owned Failures
- Missing planning projection for active trajectory state
- Projections that lose entity ids or checkpoint continuity
- Governance artifacts that drift away from current runtime truth

## Mutation Boundary
- May write durable planning/governance projections under `.hivemind/project/planning/`.
- Must not own runtime routing, recovery decisions, or command execution.

## Contracts
- Inbound: trajectory/workflow/task/recovery state
- Outbound: readable planning SOT with stable ids and projection references
