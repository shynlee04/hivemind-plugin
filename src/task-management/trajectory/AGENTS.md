# Trajectory Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/task-management/trajectory/` owns execution trajectory and lineage records — session parent/child trees, event sequences, and checkpoint tracking. `types.ts` defines the canonical `TrajectoryRecord`, `TrajectoryEvent`, `TrajectoryCheckpoint`, and `EvidenceRef` contracts. `ledger.ts` manages the trajectory ledger persisted to `.hivemind/state/`. `store-operations.ts` provides CRUD operations on trajectory records. Trajectory never owns or mutates journal, continuity, or delegation evidence — it references them via `EvidenceRef` strings. Source evidence: `.planning/codebase/ARCHITECTURE.md:54`, `.planning/codebase/ARCHITECTURE.md:288`, `.planning/codebase/STRUCTURE.md:93-94`.

## 2. Allowed mutation authority

- Trajectory may create and close `TrajectoryRecord` entries (`active`/`closed` status). Evidence: `.planning/codebase/ARCHITECTURE.md:192-193`.
- May append `TrajectoryEvent` and `TrajectoryCheckpoint` records to active trajectories via `store-operations.ts`.
- May reference external evidence via `EvidenceRef` strings without owning or mutating the referenced authorities.
- Ledger consumed by the `hivemind-trajectory` tool for read-side inspection and mutation.

## 3. Forbidden mutations / explicit no-go boundaries

- Trajectory SHALL NOT own or mutate journal, continuity, or delegation records; it only references them. Evidence: `.planning/codebase/ARCHITECTURE.md:288`.
- Trajectory SHALL NOT dispatch sessions or observe lifecycle events directly.
- Trajectory SHALL NOT store state in `.opencode/`; `.hivemind/` is canonical. Evidence: `.planning/codebase/ARCHITECTURE.md:268-270`.
- Trajectory SHALL NOT register tools; the `hivemind-trajectory` tool lives in `src/tools/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/hivemind/` | Reads/writes trajectory records via `hivemind-trajectory` tool | Tools own CQRS; trajectory owns record model |
| `src/task-management/continuity/` | Referenced by trajectory for session lineage context | Continuity owns state; trajectory owns lineage tree |
| `src/task-management/journal/` | Referenced by trajectory for event history context | Journal owns events; trajectory references them |
| Tests | Validate trajectory record CRUD, event/checkpoint append | Must verify ledger versioning |

## 5. Naming and placement conventions

- `types.ts` — `TrajectoryRecord`, `TrajectoryEvent`, `TrajectoryCheckpoint`, `EvidenceRef`, `TrajectoryStatus`, `TRAJECTORY_LEDGER_VERSION`.
- `ledger.ts` — ordered ledger. `store-operations.ts` — CRUD. `index.ts` — barrel re-exports.
- Tests mirror under `tests/lib/task-management/trajectory/`.

## 6. Quality gates and evidence expectations

- Changes require `npm run typecheck` and scoped `npx vitest run tests/lib/task-management/trajectory/...`. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Ledger version changes require migration evidence and backward-compatibility testing.
- Docs-only edits remain L5 evidence. Runtime readiness requires live or authorized proof. Evidence: `.planning/ROADMAP.md:47-49`.
