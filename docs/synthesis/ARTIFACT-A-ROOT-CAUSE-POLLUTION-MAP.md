# ROOT-CAUSE POLLUTION MAP — Hivemind Architecture Audit

> **Status**: Investigation Complete — Evidence Accumulated  
> **Purpose**: Trace pollution generators from source → dist → runtime artifacts  
> **Generated**: 2026-03-14  
> **Cycle**: Architecture Synthesis Phase 1

---

## EXECUTIVE SUMMARY

| Metric | Finding | Severity |
|--------|---------|----------|
| **Task Duplication** | 3 batches of 4 identical tasks (12 total) | **CRITICAL** |
| **brain.json Size** | 215 LOC, ~80KB content (should be <300 LOC total) | **HIGH** |
| **Session Lineage Duplication** | Same sessionId in both hivefiver/ and hiveminder/ | **HIGH** |
| **Large Files >500 LOC** | 25 files in lib/ require refactoring | **MEDIUM** |
| **Similar-Named Session Files** | 12 session-*.ts files with overlapping responsibilities | **MEDIUM** |
| **Backup Chains** | brain.json.bak.2026-03-14* pollution | **LOW** |

---

## 1. CRITICAL POLLUTION GENERATORS

### 1.1 Task Duplication on init.seed

**Source**: src/lib/hivefiver-integration.ts

**Emission Path**: seedTasks() creates new phase+tasks without deduplication check → graph/tasks.json accumulates orphan batches

**Evidence** (.hivemind/graph/tasks.json):
- Batch 1: parent_phase_id: 3f2b6e65... (orphaned)
- Batch 2: parent_phase_id: e3b017b8... (orphaned)  
- Batch 3: parent_phase_id: 4aeb3e96... (active)

**Root Cause**: No deduplication check before creating new phase+tasks.

### 1.2 Session Lineage Duplication

**Source**: src/lib/session-kernel.ts

**Emission Path**: ensureSessionKernelState() writes to BOTH hivefiver/ and hiveminder/ when lineageScope undefined

**Root Cause**: Ambiguous lineageScope routing causes defensive writes to both.

### 1.3 brain.json Context Bloat

**Source**: src/lib/state-mutation-queue.ts

**Evidence**: brain.json contains full user prompts, stale offtrack_todo_pending, growing cycle_log

**Root Cause**: No compaction/pruning strategy for brain.json.

---

## 2. LARGE FILES REQUIRING REFACTORING (>500 LOC)

### Critical Split Required (>800 LOC)

| File | LOC | Recommendation |
|------|-----|----------------|
| doc-intel.ts | 1785 | Split: doc-read.ts, doc-write.ts, doc-search.ts, doc-batch.ts |
| hierarchy-tree.ts | 1385 | Split: tree-types.ts, tree-crud.ts, tree-queries.ts, tree-io.ts |
| state-mutation-queue.ts | 928 | KEEP (architecturally necessary) + ADD PRUNING |
| write-ops.ts | 876 | Keep modular |
| detection.ts | 857 | Split: detection-types.ts, signal-compilers.ts |
| graph-migrate.ts | 853 | ARCHIVE — one-time use complete |
| signature-extractor.ts | 821 | Split: tree-sitter-parser.ts, signature-types.ts |
| paths.ts | 757 | Split: project-paths.ts, session-paths.ts, kernel-paths.ts |
| hivefiver-integration.ts | 742 | FIX seeding logic |
| session-kernel.ts | 672 | KEEP + MERGE session-engine.ts |
| session-engine.ts | 669 | MERGE into session-kernel.ts |
| session_coherence.ts | 663 | MERGE into session-governance.ts |
| read-ops.ts | 663 | Keep modular |
| cognitive-packer.ts | 622 | Keep |
| doctor-recovery.ts | 604 | Keep |
| planning-ops.ts | 589 | Keep |
| manifest.ts | 561 | Keep |
| planning-authority.ts | 549 | Keep |
| inspect-engine.ts | 549 | Keep |
| session-io.ts | 514 | Keep |
| session-governance.ts | 511 | KEEP + MERGE coherence |

---

## 3. DUPLICATION ANALYSIS

### Functional Duplication

| File A | File B | Overlap | Recommendation |
|--------|--------|---------|----------------|
| session-kernel.ts | session-engine.ts | Bootstrap logic | MERGE into kernel |
| session_coherence.ts | session-governance.ts | State management | MERGE into governance |
| paths.ts | hiveops-paths.ts | Path resolution | MERGE into paths.ts |
| plan-fs.ts | fs/planning-ops.ts | Planning FS ops | CONSOLIDATE |

### State Authority Conflicts

Session ID lives in: brain.json, hiveneuron.json, graph/tasks.json, lineage files (×2)
Hierarchy cursor: brain.json, hierarchy.json
Tasks: graph/tasks.json, orphans.json, legacy state/tasks.json

---

## 4. SIMILAR-NAMED SESSION FILES (12 files)

**Current**: session_coherence.ts, session-boundary.ts, session-engine.ts, session-export.ts, session-governance.ts, session-intent-classifier.ts, session-kernel.ts, session-memory-purge.ts, session-role.ts, session-runtime.ts, session-split.ts

**Recommended Consolidation** into lib/session/:
- kernel.ts ← Merge kernel + engine
- governance.ts ← Merge governance + coherence
- lifecycle.ts ← Merge runtime + boundary
- intent.ts, export.ts, memory.ts, role.ts, split.ts, types.ts

---

## 5. RECOMMENDED IMMEDIATE ACTIONS

### Critical Fixes (Phase 1)

1. Fix hivefiver-integration.ts:seedTasks() — deduplicate before creating
2. Fix session-kernel.ts — single lineage routing
3. Add brain.json compaction logic
4. Delete backup files (brain.json.bak*)
5. Clean orphan tasks

### Consolidation (Phase 2)

1. Merge session-engine.ts → session-kernel.ts
2. Merge session_coherence.ts → session-governance.ts
3. Merge hiveops-paths.ts → paths.ts

### Archive (Phase 3)

1. Archive graph-migrate.ts → .archive/migration/
2. Quarantine orphans.json → .archive/orphans/

---

**END OF ROOT-CAUSE POLLUTION MAP**
