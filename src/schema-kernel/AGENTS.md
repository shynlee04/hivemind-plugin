# src/schema-kernel/ — Phase 1 Contract Authority

Owns additive machine-authoritative contracts for persisted and cross-session Phase 1 records.

## Boundary

- This sector defines schemas and record shapes.
- It does not own durable writes, hook logic, or supervisor orchestration.
- Runtime behavior should consume these contracts rather than redefining them ad hoc in other sectors.

## Files

| File | Purpose |
|------|---------|
| `shared.ts` | Common enums and small shared schema primitives |
| `lifecycle-records.ts` | Entry, runtime invocation, turn output, and delegation receipt contracts |
| `orchestration-records.ts` | Supervisor, session, workflow graph, wave, and guard contracts |
| `evidence-records.ts` | Freshness, deadlock, and replay contracts |
| `index.ts` | Sector barrel |

## Rules

- Keep schemas decomposed by concern; do not create a contract monolith.
- Favor additive introduction first, then migrate consumers slice by slice.
- Public package exports stay stable; internal schema-kernel modules do not imply new package entrypoints.
