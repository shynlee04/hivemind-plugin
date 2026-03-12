# Archive Inventory — 2026-03-12 (Cycles 1 + 2 + 3)

All files archived during the `P1-D.1c` subset 6 precursor consolidation tranche.
Refer to `PLAN.md §Phase 1 Status Ledger` for the binding cycle record.

---

## Dead Code — `.archive/dead-code/2026-03-12/`

### `session-memory-classifier.ts` (104 lines)

**Status**: Dead — zero consumers.
**Intended Feature**: Keyword-based classifier for session artifacts into 7 lifecycle categories.
**Overlap Note**: Similar pattern to `session-intent-classifier.ts`. If revived, merge into that file.

### `swarm-cluster/swarm-executor.ts` (100 lines)

**Status**: Dead — never mounted in any hook or tool registration.
**Intended Feature**: Parallel subagent execution orchestrator with concurrency limits.

### `swarm-cluster/session-swarm.ts` (346 lines)

**Status**: Cascading dead — sole consumer was dead `swarm-executor.ts`.
**Intended Feature**: Session-aware swarm coordination with delegation packet generation.

### `compaction-engine.ts` (448 lines) — Cycle 2

**Status**: Dead — zero runtime consumers (2 orphaned test files only).
**Intended Feature**: Full compaction lifecycle: turning points, reports, execution.
**Overlap Note**: If revived, integrate into session-engine or dedicated compaction tool action.

### `planning-materializer.ts` (248 lines) — Cycle 3

**Status**: Dead — zero runtime consumers (1 orphaned test file only).
**Intended Feature**: Materializes planning docs from graph data into markdown via `doc-intel.ts`.
**Overlap Note**: Superseded by `hivemind_doc` tool V2.

---

## Consolidated — `.archive/consolidated/2026-03-12/`

### `task-cluster/` (3 files → 1)

| Archived File | Lines | Merged Into |
|--------------|:---:|------------|
| `task-authority.ts` | 153 | `src/lib/task-governance.ts` |
| `task-ownership.ts` | 118 | `src/lib/task-governance.ts` |
| `task-topology.ts` | 44 | `src/lib/task-governance.ts` |

### `session-cluster/` (4 files)

| Archived File | Lines | Absorbed Into |
|--------------|:---:|------------|
| `session-profile.ts` | 64 | `src/lib/session-runtime.ts` |
| `session-coherence-types.ts` | 65 | `src/lib/session_coherence.ts` |
| `onboarding.ts` | 118 | `src/hooks/session-lifecycle.ts` (Cycle 2) |
| `hivemind-bootstrap.ts` | 69 | `src/tools/hivemind-session.ts` (Cycle 2) |

### `governance-cluster/` (1 file)

| Archived File | Lines | Absorbed Into |
|--------------|:---:|------------|
| `context-escalation.ts` | 170 | `src/lib/session-governance.ts` |

### `utility-cluster/` (2 files) — Cycle 3

| Archived File | Lines | Absorbed Into |
|--------------|:---:|------------|
| `intent-clarification.ts` | 98 | `src/hooks/messages-transform.ts` |
| `commit-advisor.ts` | 35 | `src/hooks/soft-governance.ts` |

---

## Deprecated Scripts — `.archive/deprecated-scripts/2026-03-12/`

| Script | Reason |
|--------|--------|
| `auto-init.sh` | Replaced by `src/hooks/event-handler.ts` bootstrap |
| `classify-intent.sh` | Replaced by `src/lib/session-intent-classifier.ts` |
| `detect-entry.sh` | Replaced by `src/lib/session-engine.ts` entry detection |

---

## Barrel Cleanup

- `src/lib/index.ts`: 32 wildcard `export *` re-exports removed (zero consumers)
- `src/tools/index.ts`: 5 phantom tool exports removed (hivemind-declare, hiveops-gate/sot/export/todo)
- Tool files remain; only barrel re-exports removed

---

## Corrected False Positives

| File | Initially Flagged | Actual Status | Live Consumer |
|------|------------------|---------------|---------------|
| `tool-activation.ts` | Dead | **Alive** | `session-governance.ts` |
| `project-snapshot.ts` | Dead | **Alive** | `session-governance.ts` |
| `session-split.ts` | Dead | **Alive** | `soft-governance.ts` |

---

## Verification (Cumulative Cycles 1+2+3)

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ Clean |
| `npm test` | Same pre-existing failures, 0 new |
| New regressions | **0** |
| Total files archived | **18** |
| `src/lib/` | 73 → 62 |
| `src/hooks/` | 10 → 9 |
| `src/tools/` | 21 → 20 |
| `scripts/` | 9 → 6 |
