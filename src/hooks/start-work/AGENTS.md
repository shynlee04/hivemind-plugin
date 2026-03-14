# src/hooks/start-work/ — First-Message Authority

## Responsibilities
- Resolve session state, lineage, purpose class, readiness gates, and initial command routing.
- Decide whether `hm-init`, `hm-doctor`, or workflow commands must run before deeper work.

## Rules
- This layer runs before plugin assembly, tool grants, or workflow execution.
- Keep the purpose model aligned to the 8-class runtime taxonomy.
- Sub-sessions inherit bounded context and must not replay full bootstrap packets.
