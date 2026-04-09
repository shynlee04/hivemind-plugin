# Refactoring Dependency DAG — 2026-04-09

> **Mode:** Orchestrator direct (swarm delegation non-functional)
> **Sources:** refactoring-plan, cross-batch-findings, pair-mapping

---

## DAG Visualization

```
                    ┌─────────────────┐
                    │  Phase 0: C1-C5  │ ← Critical bugs
                    │  (5 fixes)       │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Phase 1: S3     │ ← Dedup
                    │  (location fix)  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───────┐     │     ┌────────▼───────┐
     │ 2a: MERGE      │     │     │ 2b: SPLIT      │
     │ session-ctx →  │     │     │ delegation-insp │
     │ planning-files │     │     │ → 2 new skills  │
     └────────┬───────┘     │     └────────┬───────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────┐
                    │ 2c: RENAME ×3   │ ← Can parallel with 2a/2b
                    │ 2d: CREATE ×2   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Phase 3: DESC   │ ← 11 description rewrites
                    │  REWRITE SPRINT  │    (depends on final names)
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───────┐     │     ┌────────▼───────┐
     │ 4a: ORPHAN      │     │     │ 4b: DEDUP       │
     │ RESOLUTION (11) │     │     │ SCRIPTS (9 pairs)│
     └────────┬───────┘     │     └────────┬───────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────┐
                    │  Phase 5: QUAL   │ ← Body enhancements
                    │  + EVAL EXPAND  │    + 15 evals to create
                    └─────────────────┘
```

---

## Dependency Table

| Op | Depends On | Blocks | Can Parallel With | Effort | Risk |
|----|-----------|--------|-------------------|--------|------|
| **0.1** fix validate-gate.sh | — | 2c (rename) | 0.2-0.5 | S | LOW |
| **0.2** fix depth stubs | — | Phase 5 body work | 0.1, 0.3-0.5 | S | LOW |
| **0.3** generate tech-stack.md | — | — | 0.1-0.2, 0.4-0.5 | S | LOW |
| **0.4** regenerate project-structure.md | — | — | all others | S | LOW |
| **0.5** decide canonical location | — | Phase 1 | all others | XS | NONE |
| **1.1** merge .opencode/ content | 0.5 | Phase 2 | — | M | MEDIUM |
| **1.2** delete .opencode/ duplicates | 1.1 | Phase 2 | — | S | LOW |
| **1.3** move eval-harness | 0.5 | 2c (rename) | 1.1 | XS | NONE |
| **2a** merge session-ctx → planning | 1.2 | Phase 3 (desc) | 2b, 2c, 2d | M | LOW |
| **2b** split delegation-inspection | 1.2 | Phase 3 (desc) | 2a, 2c, 2d | L | MEDIUM |
| **2c** rename 3 skills | 1.2, 1.3 | Phase 3 (desc) | 2a, 2b, 2d | S | LOW |
| **2d** create 2 new skills | 1.2 | Phase 3 (desc) | 2a, 2b, 2c | L | MEDIUM |
| **3** description rewrite ×11 | 2a-2d | Phase 4 | — | M | MEDIUM |
| **4a** resolve 11 orphan scripts | 3 | Phase 5 | 4b | M | LOW |
| **4b** dedup 9 conflict script pairs | 3 | Phase 5 | 4a | M | MEDIUM |
| **5** body quality + evals | 4a, 4b | — | — | XL | MEDIUM |

---

## Critical Path

```
0.5 → 1.1 → 1.2 → 2b (split) → 3 (rewrite) → 4a (orphans) → 5 (quality)
```

**Critical path length:** 6 sequential steps
**Estimated critical path effort:** L + M + M + M + M + XL = **XXL**

**Parallelizable work off critical path:**
- 0.1-0.4 can run simultaneously
- 2a (merge) parallel with 2b (split)
- 2c (rename) parallel with 2b (split)
- 4a and 4b parallel with each other

---

## Risk Assessment Per Operation

| Op | What Breaks If Wrong | Recovery |
|----|---------------------|----------|
| 0.1 validate-gate.sh fix | Synthesize workflow still fails | Git revert single file |
| 0.2 depth stubs | Meta-builder routes to empty content | Re-stub, no data loss |
| 1.1 merge .opencode/ content | Unique content lost | Git diff before delete |
| 2a merge session-ctx | planning-with-files gains wrong schema | Git revert, re-merge |
| 2b split delegation-insp | Content assigned to wrong half | Full content inventory before split |
| 2c rename skills | Agent definitions in .opencode/agents/ reference old names | Update agents simultaneously |
| 2d create new skills | Low quality new skills | Use gold standard templates |
| 3 description rewrite | Reduced trigger accuracy | Before/after trigger eval comparison |
| 4a orphan resolution | Scripts deleted that should be integrated | Verify each against SKILL.md |
| 4b script dedup | Shared scripts create coupling | Keep intentional duplication for standalone |
| 5 body quality | Over-engineering thin skills | Stop at 200L target |

---

## Recommended Execution Order (3 Waves)

### Wave 1: Foundation (Phase 0 + 1)
- All 5 critical fixes
- Canonical location decision + dedup
- **Gate:** All tests pass, no phantom references

### Wave 2: Structure (Phase 2 + 3)
- Merge, split, rename, create
- Description rewrite sprint
- **Gate:** All 20 skills have valid descriptions with triggers

### Wave 3: Quality (Phase 4 + 5)
- Script hardening + orphan resolution
- Body quality + eval expansion
- **Gate:** Target grade distribution achieved

---

_Generated: 2026-04-09_
_Method: Orchestrator direct from research synthesis_
