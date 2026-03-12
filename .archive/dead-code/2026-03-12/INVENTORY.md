# Archive Inventory — 2026-03-12 (Cycles 1 + 2)

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

### `session-cluster/` (4 files absorbed/archived)

| Archived File | Lines | Absorbed Into |
|--------------|:---:|------------|
| `session-profile.ts` | 64 | `src/lib/session-runtime.ts` |
| `session-coherence-types.ts` | 65 | `src/lib/session_coherence.ts` |
| `onboarding.ts` | 118 | `src/hooks/session-lifecycle.ts` (Cycle 2) |
| `hivemind-bootstrap.ts` | 69 | `src/tools/hivemind-session.ts` as `bootstrap` action (Cycle 2) |

**Consumers rewired**: `hooks/session_coherence/types.ts`, `session-lifecycle.ts`, `src/index.ts`, `soft-governance.ts`, `session-created-bootstrap.test.ts`

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

### Phantom Tool Exports (Cycle 2)

5 unmounted tool exports removed from `src/tools/index.ts` barrel:
- `hivemind-declare.ts` — governance-only string refs
- `hiveops-gate.ts` — P1-C.1 compatibility debt
- `hiveops-sot.ts` — P1-C.1 compatibility debt
- `hiveops-export.ts` — P1-C.1 compatibility debt
- `hiveops-todo.ts` — P1-C.1 compatibility debt

Tool files remain in `src/tools/`; only barrel re-exports removed.

See `BARREL-CLEANUP-NOTES.md` in this directory for the full consumer analysis.

---

## Corrected False Positives

| File | Initially Flagged | Actual Status | Live Consumer |
|------|------------------|---------------|---------------|
| `tool-activation.ts` | Dead | **Alive** | `session-governance.ts` |
| `project-snapshot.ts` | Dead | **Alive** | `session-governance.ts` |
| `session-split.ts` | Dead | **Alive** | `soft-governance.ts` |

## Dead Code — Cycle 2

### `compaction-engine.ts` (448 lines)

**Status**: Dead — zero runtime consumers. Only 2 test consumers (`compact-purification.test.ts`, `max-compaction-enforcement.test.ts`).
**Intended Feature**: Full compaction lifecycle: identify turning points, generate compaction reports, execute compaction (archive + index + graph + hierarchy reset).
**Key Exports**: `TurningPoint`, `CompactionReport`, `identifyTurningPoints()`, `generateNextCompactionReport()`, `executeCompaction()`
**Overlap Note**: Related compaction-triggering logic lives in `session-lifecycle.ts` (stale session archival) and `hivemind_session close` action. If revived, integrate into session-engine or make a dedicated compaction tool action.

---

## Verification

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ Clean |
| `npm test` | 358/367 (9 pre-existing) |
| New regressions | **0** |
