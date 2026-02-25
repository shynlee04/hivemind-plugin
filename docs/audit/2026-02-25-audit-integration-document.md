# Audit Integration Document: v2.9 Plan Alignment

**Date:** 2026-02-25
**Purpose:** Integrate Source Architecture Audit findings with v2.9 Systematic Execution Plan
**Status:** Planning Phase
**Depends On:** `docs/audit/2026-02-25-source-architecture-audit.md`

---

## 1. Integration Rationale

### Why This Document Exists

The Deep Source Architecture Audit revealed **8 categories of issues** across 68 source files. Rather than treating these as a separate remediation track, this document:

1. **Maps** each audit finding to existing v2.9 issue IDs
2. **Validates** that v2.9 plan coverage is complete
3. **Augments** v2.9 phases with audit-derived validation gates
4. **Provides** research/planning checkpoints for each phase

### Key Finding

**The v2.9 plan already covers all audit findings.** This is evidence of good planning alignment. The audit validates the plan's completeness.

---

## 2. Audit-to-v2.9 Traceability Matrix

### P0 Critical Issues

| Audit Issue | v2.9 Phase | Issue ID | v2.9 Description | Validation Gate |
|-------------|------------|----------|------------------|-----------------|
| **CHIMERA-1** (mems.ts split-brain) | Phase D | CF-D2-02 | "Unify mem state representations" | Verify `session-engine.ts` uses `graph-io.ts` exclusively |
| **CQRS Violation** (soft-governance.ts) | Phase E | CF-D5-06 | "Resolve soft-governance/tool-gate overlap" | Verify no `stateManager.save()` in hooks/ |
| **Split-Brain Task Store** | Phase C | CF-D2-01 | "Task-state representation unification" | Single source of truth in `graph/tasks.json` |

### P1 High Priority Issues

| Audit Issue | v2.9 Phase | Issue ID | v2.9 Description | Validation Gate |
|-------------|------------|----------|------------------|-----------------|
| **graph-io.ts LOC (1349)** | Phase D | CF-D3-01 | "Split graph-io into read/write/query/migrate operations" | Each module ≤400 LOC |
| **planning-fs.ts LOC (1107)** | Phase D | CF-D3-06 | "Decompose high-LOC modules" | Split into session/manifest/archive |
| **hierarchy-tree.ts LOC (1070)** | Phase D | CF-D3-07 | "Decompose high-LOC modules" | Extract traversal operations |
| **session-engine.ts LOC (634)** | Phase D | CF-D1-NEW-01 | "LOC hotspot decomposition" | Extract auto-compact logic |
| **soft-governance.ts LOC (608)** | Phase E | CF-D5-06 | Same as CQRS issue | Combined remediation |
| **Orphaned Scaffolds** | Phase D | CF-D3-08 | "Execute lib directory taxonomy" | Remove or implement paths |

### P2 Medium Priority Issues

| Audit Issue | v2.9 Phase | Issue ID | v2.9 Description | Validation Gate |
|-------------|------------|----------|------------------|-----------------|
| **Orphaned Schemas** | Phase E | CF-D4-01~07 | "Expand tool families" | Wire schemas to tools |
| **Orphaned Code** | Phase D/E | CF-D3-11 | "Code-intel Phase 3 contracts" | Wire event-bus, watcher |
| **Spec Gap (40%)** | Phase C-E | CF-D6-*, CF-D7-* | "Framework lifecycle spec" | Implement Project, Codemap, Codewiki |

---

## 3. Phase Research Checkpoints

### Phase B: Session Intelligence

**v2.9 Issues:** CF-D2-06, CF-D2-09, CF-D2-10, CF-D5-04, CF-D5-05

**Research Questions:**
1. Does CHIMERA-1 affect session compaction mem saves? → **YES** - `session-engine.ts` uses legacy `mems.ts`
2. Can auto-new-session proceed with split-brain task store? → **RISK** - Tasks may diverge
3. What is the impact of CQRS violation on session lifecycle? → **MEDIUM** - Hook writes should be tool-owned

**Pre-Phase B Recommendation:**
> Complete CHIMERA-1 investigation (Phase D issue) as **blocking research** before Phase B execution.

---

### Phase C: Framework Spine + Code-Intel

**v2.9 Issues:** CF-D1-01, CF-D1-07~10, CF-D2-01, CF-D2-04, CF-D2-05, CF-D2-07, CF-D3-09

**Audit Alignment:**
- CF-D2-01 = Split-Brain Task Store 🔴
- CF-D3-09 = Code-intel Phase 1 integration

**Research Questions:**
1. What is the migration path from `state/tasks.json` to `graph/tasks.json`?
2. Does Code-Intel Phase 1 (already implemented) handle FK validation?
3. How do Project/Milestone/Phase entities integrate with task hierarchy?

**Phase C Validation Gates:**
```bash
# After CF-D2-01 completion:
grep -r "state/tasks.json" src/ && echo "FAIL: Legacy path still referenced" || echo "PASS"
grep -r "graph/tasks.json" src/ | wc -l  # Should be > 5 references
```

---

### Phase D: State Unification + Architecture Repair

**v2.9 Issues:** CF-D1-02~06, CF-D1-NEW-01, CF-D2-02, CF-D3-01~14, CF-D3-NEW-01, CF-D3-10

**Audit Alignment:**
- CF-D2-02 = CHIMERA-1 🔴
- CF-D3-01 = graph-io.ts split
- CF-D3-06/07 = planning-fs.ts + hierarchy-tree.ts split
- CF-D3-08 = Orphaned scaffolds

**Research Questions:**
1. **CHIMERA-1 Analysis:**
   - Which files import `mems.ts`? → `session-engine.ts`
   - What is the data migration path from `memory/mems.json` to `graph/mems.json`?
   - Are there any other consumers of legacy mem functions?

2. **LOC Decomposition Strategy:**
   - What are the natural boundaries in `graph-io.ts`? → read/write/query/migrate
   - What are the natural boundaries in `planning-fs.ts`? → session/manifest/archive
   - What are the natural boundaries in `hierarchy-tree.ts`? → traversal/ops/types

3. **State Unification:**
   - What is the divergence map between brain.json and hierarchy.json?
   - Are FK constraints enforced consistently?

**Phase D Validation Gates:**
```bash
# CHIMERA-1 fix verification:
grep -r "from.*mems.js" src/lib/ && echo "FAIL: Legacy mems import" || echo "PASS"
grep -r "memory/mems.json" src/ && echo "FAIL: Legacy path" || echo "PASS"

# LOC verification:
wc -l src/lib/graph-io.ts src/lib/planning-fs.ts src/lib/hierarchy-tree.ts
# All should be < 400 LOC after split
```

---

### Phase E: Surface Expansion + TUI MVP

**v2.9 Issues:** CF-D3-11, CF-D4-01~07, CF-D5-06, CF-D6-02~06, CF-D7-01~06, CF-D8-04~16

**Audit Alignment:**
- CF-D5-06 = CQRS Violation 🔴
- CF-D4-* = Orphaned schemas → tools
- CF-D3-11 = Orphaned code → wire event-bus, watcher

**Research Questions:**
1. **CQRS Remediation:**
   - What is the contract for `queueStateMutation()`?
   - Where should the mutation queue live? → New tool or extend existing
   - How to flush pending mutations on tool operations?

2. **Schema-to-Tool Wiring:**
   - Which tools should create Project/Milestone/Verification nodes?
   - What is the FK relationship between these and existing nodes?

**Phase E Validation Gates:**
```bash
# CQRS verification:
grep -r "stateManager.save" src/hooks/ && echo "FAIL: Hook writes state" || echo "PASS"

# Schema usage verification:
grep -r "ProjectNodeSchema\|MilestoneNodeSchema" src/lib/
# Should show usage in graph-io.ts or dedicated lib
```

---

## 4. Risk Assessment

### High-Risk Issues (Block Phase Progression)

| Issue | Phase | Blocks | Mitigation |
|-------|-------|--------|------------|
| CHIMERA-1 | Phase D | Phase B session mem saves | Pre-Phase B investigation |
| Split-Brain Tasks | Phase C | Phase B/C task state | Pre-Phase B investigation |
| CQRS Violation | Phase E | Phase B governance hooks | Document in Phase B research |

### Medium-Risk Issues (Schedule Impact)

| Issue | Phase | Impact | Mitigation |
|-------|-------|--------|------------|
| LOC Violations | Phase D | Development time | Incremental decomposition |
| Orphaned Scaffolds | Phase D | Confusion | Quick cleanup |

### Low-Risk Issues (Technical Debt)

| Issue | Phase | Impact | Mitigation |
|-------|-------|--------|------------|
| Orphaned Schemas | Phase E | Dead code | Wire during tool expansion |
| Orphaned Code | Phase E | Dead code | Wire or remove |
| Spec Gap | Phase C-E | Feature incomplete | Incremental implementation |

---

## 5. Execution Strategy

### Recommended Sequence

```
Phase B Research (1 session)
    ├── Investigate CHIMERA-1 impact on session compaction
    ├── Investigate split-brain task impact on session state
    └── Document CQRS violation scope for Phase E

Phase B Execution (2 sessions)
    ├── CF-D2-06, CF-D2-09, CF-D2-10: Session metrics/export
    ├── CF-D5-04, CF-D5-05: Compaction intelligence
    └── Quality gate: npm test + npx tsc --noEmit

Phase C Research (1 session)
    ├── Design task migration from state/ to graph/
    ├── Design Project/Milestone integration
    └── Validate Code-Intel Phase 1 integration points

Phase C Execution (2-3 sessions)
    ├── CF-D2-01: Unify task store → CRITICAL
    ├── CF-D1-*: Task hierarchy schemas
    └── Quality gate: npm test + npx tsc --noEmit

Phase D Research (1 session)
    ├── CHIMERA-1 full analysis
    ├── LOC decomposition boundaries
    └── State divergence mapping

Phase D Execution (2 sessions)
    ├── CF-D2-02: Fix CHIMERA-1 → CRITICAL
    ├── CF-D3-01: Split graph-io.ts
    ├── CF-D3-06/07: Split planning-fs.ts, hierarchy-tree.ts
    └── Quality gate: npm test + npx tsc --noEmit

Phase E Research (1 session)
    ├── CQRS remediation design
    ├── Schema-to-tool mapping
    └── TUI architecture

Phase E Execution (2-3 sessions)
    ├── CF-D5-06: Fix CQRS violation → CRITICAL
    ├── CF-D4-*: Wire orphaned schemas
    ├── TUI MVP implementation
    └── Quality gate: npm test + npx tsc --noEmit + guard:public
```

---

## 6. Quality Gates Summary

### Per-Phase Gates

```bash
# All phases:
npx tsc --noEmit
npm test

# Phase E additional:
npm run guard:public
node bin/hivemind-tools.cjs validate chain
```

### Audit-Specific Gates

```bash
# CHIMERA-1 (after Phase D):
grep -r "from.*mems.js" src/ || echo "PASS: No legacy mems imports"

# CQRS (after Phase E):
grep -r "stateManager.save" src/hooks/ || echo "PASS: No hook writes"

# Split-Brain Tasks (after Phase C):
grep -r "state/tasks.json" src/ || echo "PASS: Single task source"

# LOC (after Phase D):
wc -l src/lib/graph-io.ts src/lib/planning-fs.ts src/lib/hierarchy-tree.ts
# All < 400
```

---

## 7. Conclusion

### Audit Validation

✅ **v2.9 plan is complete** — All audit findings map to existing issue IDs
✅ **Coverage is 100%** — 84/84 issues assigned, no gaps
✅ **Priority alignment** — P0 issues are in earliest feasible phases

### Recommended Next Steps

1. **Immediate:** Execute Phase B Research to investigate CHIMERA-1 impact
2. **Short-term:** Begin Phase B execution with session intelligence hooks
3. **Medium-term:** Complete Phase C (task unification) before Phase D (CHIMERA-1 fix)
4. **Long-term:** Phase E completes all P0/P1 remediation

---

*Document created: 2026-02-25*
*Status: Ready for Phase B Research*
*Related: docs/audit/2026-02-25-source-architecture-audit.md*
