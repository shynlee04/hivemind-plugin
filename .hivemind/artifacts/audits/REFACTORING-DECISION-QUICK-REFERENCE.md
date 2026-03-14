# Refactoring Decision Quick Reference

> **Generated**: 2026-03-14T00:55:00Z  
> **Purpose**: Quick decision guide for next-stage refactoring

---

## Critical Alerts

### 🔴 Files Requiring Immediate Attention (>350 LOC)

| File | LOC | Action |
|------|-----|--------|
| `src/lib/doc-intel.ts` | 1,785 | Split into 4 modules |
| `src/lib/hierarchy-tree.ts` | 1,385 | Split into 4 modules |
| `src/lib/state-mutation-queue.ts` | 928 | Split into 3 modules |
| `src/tools/hivemind-doc.ts` | 911 | Split into read/write/search |
| `src/lib/doc-intel/write-ops.ts` | 876 | Merge with read-ops |
| `src/lib/detection.ts` | 857 | Extract sub-detectors |
| `src/lib/graph-migrate.ts` | 853 | Archive after migration |
| `src/tools/hiveops-todo.ts` | 522 | Archive to src/legacy/ |

### 🟡 Pollution Sources (Root Cause → Symptom)

| Root Module | Generates | LOC Impact |
|-------------|-----------|------------|
| `graph-io.ts` | `graph/*.json` | 1,445 |
| `session-runtime.ts` | `sessions/runtime/ses_*/` | ~500 |
| `state-mutation-queue.ts` | `state/brain.json` (bloated) | 250 |
| `persistence.ts` | `state/brain.json.bak*` | ~750 |
| `manifest.ts` | Empty `*/manifest.json` | ~100 |

---

## Decision Matrix

### Decision 1: Legacy Tool Archival
| Option | Risk | Value | Recommendation |
|--------|------|-------|----------------|
| A: Archive immediately | Low | High | ✅ RECOMMENDED |
| B: Migrate then archive | Medium | Medium | |

**Rationale**: `hiveops-*` tools are unmounted "P1-C.1 compatibility debt" with duplicate functionality in `hivemind-*` tools.

### Decision 2: Session File Consolidation
| Option | Risk | Value | Recommendation |
|--------|------|-------|----------------|
| A: Consolidate to 3-4 modules | Medium | High | ✅ RECOMMENDED |
| B: Keep separate, better org | Low | Medium | |

**Rationale**: 14 session files with overlapping concerns create confusion. Consolidation improves maintainability.

### Decision 3: State Model Replacement
| Option | Risk | Value | Recommendation |
|--------|------|-------|----------------|
| A: Replace with active.json | Medium | High | ✅ RECOMMENDED |
| B: Evolve brain.json | Low | Low | |

**Rationale**: brain.json has bloated metrics, backup chain issues. Clean slate is better.

### Decision 4: Graph System Fate
| Option | Risk | Value | Recommendation |
|--------|------|-------|----------------|
| A: Archive, rebuild if needed | Low | High | ✅ RECOMMENDED |
| B: Clean up and keep | High | Low | |

**Rationale**: Current graph system is polluted (1445 LOC auto-generated). Rebuild only if actually needed.

---

## Quick Action Checklist

### Phase 1: Foundation (Do First)
- [ ] Archive `src/tools/hiveops-*.ts` to `src/legacy/tools/`
- [ ] Archive `.hivemind/graph/*.json` to `.hivemind/archive/graph/`
- [ ] Clean up `.hivemind/state/brain.json.bak*` files
- [ ] Create `.hivemind/state/active.json` from brain.json consolidation
- [ ] Create `.hivemind/state/anchors.json` for cross-session memory
- [ ] Generate `config.json` via hm-doctor
- [ ] Populate `.hivemind/sessions/current.json`

### Phase 2: Integrity (Do Second)
- [ ] Add cleanup hooks to `graph-io.ts`
- [ ] Add rotation policy to `persistence.ts`
- [ ] Add expiration to `session-runtime.ts`
- [ ] Consolidate 14 session files into 3-4 modules
- [ ] Standardize naming to hyphenated

### Phase 3: Cleanup (Do Third)
- [ ] Split `doc-intel.ts` into 4 modules
- [ ] Split `hierarchy-tree.ts` into 4 modules
- [ ] Split `state-mutation-queue.ts` into 3 modules
- [ ] Merge governance files into governance/ module
- [ ] Merge planning files into planning/ module
- [ ] Merge detection files into detection/ module

### Phase 4: Hardening (Do Later)
- [ ] Add CI linting for 350 LOC threshold
- [ ] Implement automatic cleanup on session close
- [ ] Add drift detection and alerts
- [ ] Optimize context loading with lazy loading
- [ ] Improve hm-init guided flow

---

## Key Architectural Decisions

### What We Keep from GSD
- ✅ Atomic phase lifecycle (adapted for OpenCode)
- ✅ STATE.md as rolling snapshot (split into JSON + MD)
- ✅ Milestone-archive pattern
- ✅ Config-driven model resolution
- ✅ Verification patterns
- ✅ Template system (converted to skills/commands)
- ✅ Continuation format (enhanced with anchors)

### What We Change from GSD
- 🔄 Interactive TUI/CLI → Non-interactive plugin hooks
- 🔄 `.planning/` as single root → `.hivemind/project/planning/`
- 🔄 File-based phase numbering → Plan hierarchy with prefix IDs
- 🔄 STATE.md as sole state → `hiveneuron.json` + `hivebrain.md`
- 🔄 Agent-specific model profiles → Skill-based model hints
- 🔄 Subagent delegation via bash → OpenCode Task tool
- 🔄 Git-centric planning commits → Optional git integration

### What We Reject from GSD
- ❌ Nyquist Validation (too specialized)
- ❌ Branching Strategy Templates (user-specific)
- ❌ Model Profile Table (handled by config)
- ❌ Command-line argument parsing (use Zod schemas)
- ❌ `.planning/` directory structure (conflicts with `.hivemind/`)

---

## OpenCode Integration Map

### Plugin Hooks → Governance Actions
```
tool.execute.before   → Pre-execution verification gates
tool.execute.after    → Post-execution audit trail
session.compacting    → Inject governance state into compaction
session.created       → Initialize governance state from anchors
session.idle          → Check pending checkpoints
file.edited           → Track modifications for audit trail
```

### Custom Tools → Governance Operations
```
hivemind_checkpoint   → Create/verify checkpoints
hiveops_gate          → Quality gates with pass/fail
hiveops_export        → Structured session exports
hivemind_anchor       → Persistent cross-session memory
hiveops_todo          → Hierarchical task management
```

### Skills → Governance Patterns
```
hivemind-session-lifecycle → Session management patterns
hivemind-gates            → Quality gate patterns
hivemind-exports          → Handoff patterns
hivemind-verification     → Verification patterns
```

---

## Health Status Summary

### Current `.hivemind/` Health
- **hiveneuron.json**: ✅ GOOD (64 LOC, concise)
- **hivebrain.md**: ✅ GOOD (37 LOC, readable)
- **config/**: ✅ GOOD (structured)
- **states/shared/**: ✅ GOOD (concise indices)
- **project/planning/**: ✅ GOOD (canonical planning root)
- **templates/**: ✅ GOOD (useful)
- **state/**: ❌ POLLUTED (bloated brain.json + backups)
- **sessions/**: ⚠️ MIXED (blank active.md, auto-spawned runtime)
- **graph/**: ❌ POLLUTED (1445 LOC auto-generated)
- **codemap/**: ⚠️ STALE (empty manifest)
- **codewiki/**: ⚠️ STALE (empty manifest)
- **memory/**: ⚠️ STALE (empty manifest)
- **plans/**: ⚠️ STALE (empty manifest)

### Integrity Issues
1. ❌ `config.json` not found
2. ❌ `active.md` is blank
3. ❌ 5 runtime session dirs never cleaned up
4. ❌ 3 `brain.json.bak` files without rotation
5. ❌ Graph orphans/tasks: 1445 LOC unclear value

---

*Quick reference for refactoring decisions. See full audit in `HIVEMIND-ARCHITECTURE-REDESIGN-AUDIT.md` for complete analysis.*
