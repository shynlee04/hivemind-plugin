# ARCHIVING DECISIONS & MIGRATION RATIONALES

> **Purpose**: Classify artifacts for archiving, migration, or preservation  
> **Generated**: 2026-03-14

---

## DECISION LEGEND

| Code | Meaning |
|------|---------|
| **KEEP** | Preserve, possibly refactor |
| **MERGE** | Combine with another file |
| **SPLIT** | Divide into multiple files |
| **ARCHIVE** | Move to .archive/ |
| **DELETE** | Remove entirely |
| **QUARANTINE** | Isolate due to pollution |

---

## 1. .hivemind STATE ARTIFACTS

| Artifact | Decision | Rationale |
|----------|----------|-----------|
| state/brain.json | KEEP + PRUNE | Essential, needs compaction |
| state/brain.json.bak.* | DELETE | Backup pollution — git handles versioning |
| state/hierarchy.json | MERGE into brain.json | Duplicate cursor state |
| state/tasks.json | DELETE | Empty, deprecated |
| graph/tasks.json | KEEP + CLEAN | Clean orphan batches |
| graph/orphans.json | QUARANTINE | Move to .archive/orphans/ |
| hiveneuron.json | KEEP | Kernel steering |
| hivebrain.md | KEEP | Human-readable map |
| sessions/runtime/ses_*/ | QUARANTINE | Auto-spawned to .archive/ |
| Lineage duplicates | DEDUPE | Keep one per session |

---

## 2. LIB SOURCE FILES

### Document Intel

| File | Decision | Rationale |
|------|----------|-----------|
| doc-intel.ts (1785) | SPLIT | Split into: doc-read.ts, doc-write.ts, doc-search.ts, doc-batch.ts |
| write-ops.ts (876) | KEEP | Already modular |
| read-ops.ts (663) | KEEP | Already modular |

### Session Management

| File | Decision | Rationale |
|------|----------|-----------|
| session-kernel.ts (672) | KEEP + MERGE | Merge engine into this |
| session-engine.ts (669) | MERGE into kernel | Duplicate responsibility |
| session_coherence.ts (663) | MERGE into governance | Overlap |
| session-governance.ts (511) | KEEP + MERGE | Target for coherence |

### State/Persistence

| File | Decision | Rationale |
|------|----------|-----------|
| state-mutation-queue.ts (928) | KEEP + PRUNING | Add compaction |
| hierarchy-tree.ts (1385) | SPLIT | Split into: tree-types.ts, tree-crud.ts, tree-queries.ts |
| persistence.ts (402) | KEEP | Core persistence |

### Graph

| File | Decision | Rationale |
|------|----------|-----------|
| graph-migrate.ts (853) | ARCHIVE | Migration complete |

### Other

| File | Decision | Rationale |
|------|----------|-----------|
| detection.ts (857) | SPLIT | Split into: detection-types.ts, signal-compilers.ts |
| paths.ts (757) | SPLIT + MERGE | Split into project-paths.ts, session-paths.ts; merge hiveops-paths.ts |
| hivefiver-integration.ts (742) | FIX + KEEP | Fix seeding logic |
| signature-extractor.ts (821) | SPLIT | Split into: tree-sitter-parser.ts, signature-types.ts |

---

## 3. TOOLS FILES

| File | Decision | Rationale |
|------|----------|-----------|
| hivemind-doc.ts (911) | SPLIT | Split action dispatchers |
| All others | KEEP | Sized appropriately |

---

## 4. MIGRATION SEQUENCE

### Phase 1: Foundation (Critical)
1. Fix hivefiver-integration.ts seeding
2. Fix session-kernel.ts lineage routing
3. Add brain.json compaction
4. Delete backup files

### Phase 2: Integrity (Merge)
1. Merge session-engine → session-kernel
2. Merge coherence → governance
3. Merge hiveops-paths → paths

### Phase 3: Cleanup (Split)
1. Split doc-intel.ts (1785 → 4)
2. Split hierarchy-tree.ts (1385 → 4)
3. Split paths.ts (757 → 3)
4. Split detection.ts (857 → 2)
5. Split signature-extractor.ts (821 → 2)

### Phase 4: Archive
1. Archive graph-migrate.ts
2. Quarantine orphans.json
3. Clean auto-spawned sessions

---

## 5. FILES BY ACTION

### DELETE
- state/brain.json.bak.*
- state/tasks.json

### ARCHIVE
- graph-migrate.ts → .archive/migration/

### QUARANTINE
- graph/orphans.json → .archive/orphans/
- sessions/runtime/ses_* → .archive/sessions/

### FIX IMMEDIATELY
- hivefiver-integration.ts — Task duplication
- session-kernel.ts — Lineage duplication

---

**END OF ARCHIVING DECISIONS**
