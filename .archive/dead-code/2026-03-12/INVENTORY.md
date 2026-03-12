# Archive Inventory — 2026-03-12

All files archived during the `P1-D.1c` subset 6 precursor consolidation tranche.
Refer to `PLAN.md §Phase 1 Status Ledger` for the binding cycle record.

---

## Dead Code — `.archive/dead-code/2026-03-12/`

### `session-memory-classifier.ts` (104 lines)

**Status**: Dead — zero consumers.
**Intended Feature**: Keyword-based classifier for session artifacts into 7 lifecycle categories (`discovery_brainstorming_discuss`, `research_synthesis`, `codebase_investigation`, `planning`, `implementing`, `debug`, `test_validation_gatekeeping`).
**Key Exports**: `SESSION_MEMORY_CATEGORIES`, `SessionMemoryArtifact`, `ClassifiedSessionMemory`, `classifySessionMemoryArtifact()`, `summarizeMemoryCategories()`
**Overlap Note**: Similar pattern to `session-intent-classifier.ts`. If revived, merge into that file.

### `swarm-cluster/swarm-executor.ts` (100 lines)

**Status**: Dead — never mounted in any hook or tool registration.
**Intended Feature**: Parallel subagent execution orchestrator with configurable concurrency limits and result aggregation.
**Key Exports**: `SwarmExecutorConfig`, `SwarmResult`, `executeSwarm()`

### `swarm-cluster/session-swarm.ts` (346 lines)

**Status**: Cascading dead — sole consumer was dead `swarm-executor.ts`.
**Intended Feature**: Session-aware swarm coordination with delegation packet generation, parent/child session linking, and result merge-back into parent context.
**Key Exports**: `SwarmSession`, `SwarmDelegation`, `SessionSwarmOrchestrator`
**Overlap Note**: Delegation concepts partially live in `delegation-framework` skill and `session-engine.ts`.

---

## Consolidated — `.archive/consolidated/2026-03-12/`

### `task-cluster/` (3 files → 1)

| Archived File | Lines | Merged Into |
|--------------|:---:|------------|
| `task-authority.ts` | 153 | `src/lib/task-governance.ts` |
| `task-ownership.ts` | 118 | `src/lib/task-governance.ts` |
| `task-topology.ts` | 44 | `src/lib/task-governance.ts` |

**Consumers rewired (5)**: `hiveops-export.ts`, `state-snapshot.ts`, `hiveops-todo.ts`, `event-handler.ts`, `state-mutation-queue.ts`

### `session-cluster/` (2 files absorbed)

| Archived File | Lines | Absorbed Into |
|--------------|:---:|------------|
| `session-profile.ts` | 64 | `src/lib/session-runtime.ts` |
| `session-coherence-types.ts` | 65 | `src/lib/session_coherence.ts` |

**Consumers rewired**: `hooks/session_coherence/types.ts` (re-exports now point to `session_coherence.ts`)

### `governance-cluster/` (1 file absorbed)

| Archived File | Lines | Absorbed Into |
|--------------|:---:|------------|
| `context-escalation.ts` | 170 | `src/lib/session-governance.ts` |

**Note**: The file's own JSDoc (line 4) said `"Add to src/lib/session-governance.ts"` — was always meant to be merged.

---

## Deprecated Scripts — `.archive/deprecated-scripts/2026-03-12/`

| Script | Reason |
|--------|--------|
| `auto-init.sh` | Self-documented as deprecated; replaced by `src/hooks/event-handler.ts` bootstrap |
| `classify-intent.sh` | Self-documented as deprecated; replaced by `src/lib/session-intent-classifier.ts` |
| `detect-entry.sh` | Self-documented as deprecated; replaced by `src/lib/session-engine.ts` entry detection |

---

## Barrel Cleanup

`src/lib/index.ts` cleared of all 32 wildcard `export *` re-exports — zero consumers used the barrel. All imports across `src/`, `tests/`, and `scripts/` are direct file-to-file.

See `BARREL-CLEANUP-NOTES.md` in this directory for the full consumer analysis and feature-similarity recommendations.

---

## Corrected False Positives

| File | Initially Flagged | Actual Status | Live Consumer |
|------|------------------|---------------|---------------|
| `tool-activation.ts` | Dead | **Alive** | `session-governance.ts` |
| `project-snapshot.ts` | Dead | **Alive** | `session-governance.ts` |
| `session-split.ts` | Dead | **Alive** | `soft-governance.ts` |

---

## Verification

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ Clean |
| `npm test` | 359/367 (7 pre-existing + 1 flaky) |
| New regressions | **0** |
""", "ArtifactType": "other", "Summary": "Comprehensive archive inventory for the 2026-03-12 consolidation tranche covering dead code, consolidated clusters, deprecated scripts, barrel cleanup, and corrected false positives."}
