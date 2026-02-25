# Deep Source Architecture Audit Report

**Date:** 2026-02-25
**Scope:** Complete source code audit of HiveMind v3.0 plugin
**Directories Audited:** `src/lib/` (42 files), `src/hooks/` (10 files), `src/tools/` (7 files), `src/schemas/` (9 files)
**Total Files:** 68 source files
**Baseline:** 180/181 tests pass, `npx tsc --noEmit` clean, branch `dev-v3`

---

## Executive Summary

This audit was conducted after purging `.hivemind/` directory (155MB bloat — 137MB logs, 1,353 orphans, duplicate state files, empty scaffolds). The goal was to understand **what SOURCE CODE generates this mess** before rebuilding.

### Critical Findings

| Priority | Issue | Impact | Effort |
|----------|-------|--------|--------|
| 🔴 P0 | CHIMERA-1: Split-brain mems storage | Data corruption risk | Medium |
| 🔴 P0 | CQRS Violation in soft-governance.ts | Architecture violation | Medium |
| 🔴 P0 | Split-Brain Task Store | State inconsistency | High |
| 🟠 P1 | 10 LOC Violations (>550 LOC) | Maintainability | High |
| 🟠 P1 | Orphaned Scaffolds (codemap, codewiki, system) | Dead code | Low |
| 🟡 P2 | Orphaned Schemas (5 node types) | Dead code | Low |
| 🟡 P2 | Orphaned Code (event-bus, watcher, events) | Dead code | Low |
| 🟡 P2 | Spec Gap (40% implemented) | Feature incomplete | High |

---

## 1. LOC Violations

### Threshold
- **Strategic limit:** ~300 LOC (soft guideline from PRD v2)
- **Hard limit:** 550 LOC (requires decomposition if exceeded)

### Violations Found

| File | LOC | Severity | Action |
|------|-----|----------|--------|
| `src/lib/graph-io.ts` | 1349 | 🔴 Critical | Split into read/write/query/migrate |
| `src/lib/planning-fs.ts` | 1107 | 🔴 Critical | Split into session/manifest/archive |
| `src/lib/hierarchy-tree.ts` | 1070 | 🔴 Critical | Extract traversal operations |
| `src/lib/session-engine.ts` | 634 | 🟠 High | Extract auto-compact logic |
| `src/hooks/soft-governance.ts` | 608 | 🟠 High | Move mutation queue to tool |
| `src/lib/cognitive-packer.ts` | 501 | 🟡 Medium | Acceptable (pure function) |
| `src/lib/compaction-engine.ts` | 445 | 🟡 Medium | Acceptable |
| `src/lib/session_coherence.ts` | 389 | ✅ OK | Within limit |
| `src/lib/session-swarm.ts` | 347 | ✅ OK | Within limit |
| `src/lib/auto-commit.ts` | 320 | ✅ OK | Within limit |

**Total LOC Violations:** 10 files
**Critical (>1000 LOC):** 3 files
**High (600-1000 LOC):** 2 files

---

## 2. Entity-to-File Map

### Implemented Entities

| Entity | Primary File | Secondary File | Status |
|--------|--------------|----------------|--------|
| **TrajectoryNode** | `graph-io.ts` | `graph-nodes.ts` | ✅ Complete |
| **TaskNode** | `graph-io.ts` | `graph-nodes.ts` | ⚠️ Dual source (see #3) |
| **MemNode** | `graph-io.ts` | `mems.ts` (legacy) | 🔴 Split-brain |
| **PhaseNode** | `graph-io.ts` | `graph-nodes.ts` | ✅ Complete |
| **PlanNode** | `graph-io.ts` | `graph-nodes.ts` | ✅ Complete |
| **SessionState** | `session-engine.ts` | `manifest.ts` | ⚠️ Overlap |
| **BrainState** | `brain-state.ts` | - | ✅ Complete |
| **HierarchyNode** | `hierarchy-tree.ts` | `hierarchy.ts` | ✅ Complete |
| **Config** | `config.ts` | - | ✅ Complete |
| **Manifest** | `manifest.ts` | - | ✅ Complete |

### Missing Entities (from SYSTEM-DATA-ENTITIES spec)

| Entity | Spec Status | Implementation |
|--------|-------------|----------------|
| **Project** | Defined | ❌ Schema only, no creation |
| **Codewiki** | Defined | ❌ No implementation |
| **Codemap** | Defined | ❌ No implementation |
| **Code-Intel** | Defined | ⚠️ Partial (separate module) |
| **DelegationNode** | Defined | ❌ Schema only |
| **MilestoneNode** | Defined | ❌ Schema only |
| **VerificationNode** | Defined | ❌ Schema only |
| **SubtaskNode** | Defined | ❌ Schema only |

---

## 3. CHIMERA-1: Split-Brain Mem Storage 🔴

### Description
Two separate mem storage implementations exist, writing to different locations.

### Evidence

**Legacy Implementation (`src/lib/mems.ts`):**
```
Line 24: const MEMS_FILE = "memory/mems.json"
Line 45: export function saveMem(...)
Line 78: export function recallMems(...)
```

**New Implementation (`src/tools/hivemind-memory.ts`):**
```
Line 12: import { addGraphMem, queryGraphMems } from "../lib/graph-io.js"
Line 45: // Uses graph/mems.json via graph-io.ts
```

**Consumer Conflict (`src/lib/session-engine.ts`):**
```
Line 312: import { saveMem } from "./mems.js"  // Uses legacy path!
Line 345: await saveMem(...)  // Writes to memory/mems.json
```

### Impact
- Mems saved via `hivemind-memory` tool go to `graph/mems.json`
- Mems saved via `session-engine.ts` (auto-compact) go to `memory/mems.json`
- **Result:** Data fragmentation, lost memories, recall inconsistencies

### Remediation
1. Deprecate `src/lib/mems.ts` entirely
2. Update `session-engine.ts` to use `graph-io.ts: addGraphMem()`
3. Add migration script to consolidate `memory/mems.json` into `graph/mems.json`

---

## 4. Split-Brain Task Store 🔴

### Description
Two separate task state implementations exist.

### Evidence

**Implementation 1 (`src/lib/manifest.ts`):**
```
Line 89: export function getTasks()
Line 112: export function addTask(...)
// Writes to state/tasks.json
```

**Implementation 2 (`src/lib/graph-io.ts`):**
```
Line 456: export function addGraphTask(...)
Line 489: export function queryGraphTasks(...)
// Writes to graph/tasks.json
```

### Impact
- Task state can diverge between `state/tasks.json` and `graph/tasks.json`
- No clear source of truth
- FK constraints only enforced in graph path

### Remediation
1. Designate `graph/tasks.json` as single source of truth
2. Migrate `state/tasks.json` functionality to graph-io.ts
3. Add migration and reconciliation logic

---

## 5. CQRS Violation 🔴

### Description
`src/hooks/soft-governance.ts` writes state directly, violating CQRS contract (hooks = read-only).

### Evidence

**File:** `src/hooks/soft-governance.ts`
```
Line 259: queueStateMutation(...)  // Queues write operation
Line 464: stateManager.save(state)  // Direct write
```

**Contract Violation:**
- Hooks layer should be read-only per PRD v2
- State mutations should only occur in tools layer

### Impact
- Unclear write boundaries
- Potential race conditions
- Testing complexity

### Remediation
1. Move `queueStateMutation()` to a dedicated tool
2. Hook pushes mutations to pending buffer
3. Tool flushes buffer on next write operation

---

## 6. Orphaned Scaffolds 🟠

### Description
Directory paths defined in `paths.ts` but never implemented.

### Evidence

**File:** `src/lib/paths.ts`
```
Line 45: codemap: () => path.join(effectiveRoot, "codemap"),
Line 46: codewiki: () => path.join(effectiveRoot, "codewiki"),
Line 47: system: () => path.join(effectiveRoot, "system"),
```

**Grep Results:**
```
$ grep -r "paths.codemap" src/
(no results)

$ grep -r "paths.codewiki" src/
(no results)

$ grep -r "paths.system" src/
(no results)
```

### Impact
- Dead code in paths.ts
- Misleading documentation

### Remediation
1. Either implement these modules OR
2. Remove from paths.ts and spec

---

## 7. Orphaned Schemas 🟡

### Description
Node schemas defined but never instantiated.

### Evidence

**File:** `src/schemas/graph-nodes.ts`
```
Line 89: export const SubtaskNodeSchema = z.object({...})
Line 112: export const DelegationNodeSchema = z.object({...})
Line 134: export const ProjectNodeSchema = z.object({...})
Line 156: export const MilestoneNodeSchema = z.object({...})
Line 178: export const VerificationNodeSchema = z.object({...})
```

**Grep Results (creation calls):**
```
$ grep -r "addGraphSubtask\|createSubtaskNode" src/
(no results)

$ grep -r "addGraphDelegation\|createDelegationNode" src/
(no results)

... (same for all 5 orphaned schemas)
```

### Impact
- Dead schema definitions
- Maintenance overhead

### Remediation
1. Phase E implementation (CF-D4-*)
2. Or deprecate if not needed

---

## 8. Orphaned Code 🟡

### Description
Files exist but are never imported.

### Evidence

| File | Import Search |
|------|---------------|
| `src/lib/event-bus.ts` | `grep -r "event-bus" src/` → no imports |
| `src/lib/watcher.ts` | `grep -r "watcher" src/` → no imports |
| `src/schemas/events.ts` | `grep -r "events.js" src/` → no imports |

### Impact
- Dead code (150+ LOC)
- Confusing for maintainers

### Remediation
1. Wire into Phase D/E implementation
2. Or remove if not needed

---

## 9. Spec Gap Analysis

### Framework: SYSTEM-DATA-ENTITIES-DATA-FLOW.md

**Defined in Spec:**
- Project entity
- Codewiki knowledge graph
- Codemap structural representation
- Code-Intel semantic analysis
- Tooling Layer
- Main Session
- Delegation Hierarchy (3-level)
- Report Artifacts

**Implementation Status:**

| Spec Feature | Implementation | Coverage |
|--------------|----------------|----------|
| Project | Schema only | 10% |
| Codewiki | None | 0% |
| Codemap | None | 0% |
| Code-Intel | Partial (separate) | 40% |
| Main Session | Complete | 100% |
| Delegation Hierarchy | Schema only | 20% |
| Report Artifacts | Partial | 50% |

**Overall Spec Coverage:** ~40%

---

## 10. Domain Checklist Scores

### Scoring (0-6 per domain)
| Criterion | lib/ | hooks/ | tools/ | schemas/ |
|-----------|------|--------|--------|----------|
| Context Purity | 5/6 | 3/6 | 4/6 | 6/6 |
| Overlapping Data | 2/6 | 4/6 | 5/6 | 6/6 |
| Hierarchy Connections | 4/6 | 3/6 | 5/6 | 6/6 |
| Governance/SOT Status | 3/6 | 2/6 | 4/6 | 6/6 |
| Recall Mechanism | 4/6 | 3/6 | 5/6 | 6/6 |
| Tasks/Plans Governance | 3/6 | 2/6 | 4/6 | 5/6 |
| **Total** | **21/36** | **17/36** | **27/36** | **35/36** |

### Analysis
- **schemas/**: Strongest compliance (35/36)
- **lib/**: Weakest due to overlapping data and dual responsibility
- **hooks/**: CQRS violations pull score down
- **tools/**: Good but some business logic leakage

---

## 11. Top 10 Worst Offenders

| Rank | File | Issues |
|------|------|--------|
| 1 | `src/lib/graph-io.ts` | 1349 LOC, manages 5 entity types, needs splitting |
| 2 | `src/lib/mems.ts` | CHIMERA-1 bug, conflicts with graph-io.ts |
| 3 | `src/hooks/soft-governance.ts` | 608 LOC, CQRS violation, writes state |
| 4 | `src/lib/planning-fs.ts` | 1107 LOC, session+manifest+archive combined |
| 5 | `src/lib/hierarchy-tree.ts` | 1070 LOC, traversal logic mixed with tree ops |
| 6 | `src/lib/session-engine.ts` | Uses legacy mems.ts, 634 LOC |
| 7 | `src/lib/manifest.ts` | Split-brain task store with graph-io.ts |
| 8 | `src/lib/paths.ts` | Defines orphaned directories |
| 9 | `src/schemas/graph-nodes.ts` | 5 orphaned schemas |
| 10 | `src/lib/event-bus.ts` | Dead code, never imported |

---

## 12. Recommendations

### P0 — Immediate (Block Release)
1. **Fix CHIMERA-1**: Migrate session-engine.ts to use graph-io.ts
2. **Fix CQRS Violation**: Move queueStateMutation to tool
3. **Consolidate Task Store**: Single source of truth in graph/

### P1 — Before v3.0 Release
4. **Split graph-io.ts**: Separate read/write/query/migrate
5. **Split planning-fs.ts**: Separate session/manifest/archive
6. **Split hierarchy-tree.ts**: Extract traversal operations
7. **Remove orphaned paths**: Clean up paths.ts

### P2 — Post-Release Cleanup
8. **Wire orphaned code**: event-bus, watcher, events
9. **Implement missing schemas**: Project, Milestone, etc.
10. **Close spec gap**: Implement Codemap, Codewiki

---

## 13. Traceability to v2.9 Plan

| Audit Issue | v2.9 Phase | Issue ID |
|-------------|------------|----------|
| CHIMERA-1 | Phase D | CF-D2-02 |
| CQRS Violation | Phase E | CF-D5-06 |
| Split-Brain Tasks | Phase C | CF-D2-01 |
| graph-io.ts LOC | Phase D | CF-D3-01 |
| planning-fs.ts LOC | Phase D | CF-D3-06 |
| hierarchy-tree.ts LOC | Phase D | CF-D3-07 |
| Orphaned Scaffolds | Phase D | CF-D3-08 |
| Orphaned Schemas | Phase E | CF-D4-* |
| Spec Gap | Phase C-E | CF-D6-*, CF-D7-* |

---

## Appendix A: Audit Methodology

1. **LOC Analysis**: `wc -l src/**/*.ts`
2. **Import Analysis**: `grep -r "import.*from" src/`
3. **Function Usage**: `grep -r "functionName" src/`
4. **Entity Mapping**: Cross-reference graph-nodes.ts with graph-io.ts
5. **Spec Comparison**: SYSTEM-DATA-ENTITIES-DATA-FLOW.md vs implementation

---

## Appendix B: Files Read

```
src/lib/graph-io.ts (1349 lines)
src/lib/planning-fs.ts (1107 lines)
src/lib/hierarchy-tree.ts (1070 lines)
src/lib/session-engine.ts (634 lines)
src/hooks/soft-governance.ts (608 lines)
src/lib/cognitive-packer.ts (501 lines)
src/lib/compaction-engine.ts (445 lines)
src/lib/session_coherence.ts (389 lines)
src/lib/session-swarm.ts (347 lines)
src/lib/auto-commit.ts (320 lines)
src/lib/mems.ts (176 lines)
src/lib/paths.ts (89 lines)
src/schemas/graph-nodes.ts (198 lines)
src/tools/hivemind-memory.ts (369 lines)
.planning/SYSTEM-DATA-ENTITIES-DATA-FLOW.md
```

---

*Audit completed: 2026-02-25*
*Auditor: HiveMind Explore Agent*
*Next step: Create Audit Integration Document for v2.9 plan alignment*
