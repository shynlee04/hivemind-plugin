# Session Inspection Export

- ses_id: `ses_2da1844e2ffekE2UHKkOQxLsrg`
- prepared_at: `2026-03-25T16:50:52.463Z`

## Assistant Output

## Results

### Directory listing: `src/schema-kernel/`

```
src/schema-kernel/
├── AGENTS.md
└── index.ts
```

Only 2 files exist in the directory. Note that the `AGENTS.md` references `shared.ts`, `lifecycle-records.ts`, `orchestration-records.ts`, and `evidence-records.ts` — but those files are **not present** in this directory. They are sourced from `../archive/schema-kernel/` as re-exports in `index.ts`.

---

### File 1: `src/schema-kernel/index.ts` (17 lines)

```typescript
/**
 * Schema Kernel - Phase 1 Contract Authority
 * 
 * This is the active re-export layer for Phase 1 record contracts.
 * All contracts are authoritative and actively used by consumers.
 * 
 * @see src/schema-kernel/AGENTS.md for sector boundary rules
 */

export * from '../archive/schema-kernel/shared.js'
export * from '../archive/schema-kernel/lifecycle-records.js'
export * from '../archive/schema-kernel/orchestration-records.js'
export * from '../archive/schema-kernel/evidence-records.js'

// Active re-export layer markers
export const SCHEMA_KERNEL_ACTIVE = true
export const SCHEMA_KERNEL_CANONICAL_PATH = 'src/schema-kernel/'
```

---

### File 2: `src/schema-kernel/AGENTS.md` (27 lines)

```markdown
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
| `lifecycle-records.ts` | Entry, runtime invocation, turn output, delegation receipt contracts, and validated lifecycle record builders |
| `orchestration-records.ts` | Supervisor, session, workflow graph, wave, and guard contracts |
| `evidence-records.ts` | Freshness, deadlock, and replay contracts |
| `index.ts` | Sector barrel |

## Rules

- Keep schemas decomposed by concern; do not create a contract monolith.
- Favor additive introduction first, then migrate consumers slice by slice.
- Public package exports stay stable; internal schema-kernel modules do not imply new package entrypoints.
- Status/reporting consumers should build or parse lifecycle/orchestration records through this sector rather than publishing ad hoc JSON state with duplicate field contracts.
- The current live reporting consumer is `src/tools/runtime/tools.ts`, which now emits validated lifecycle/supervisor records in `hivemind_runtime_status`.
```