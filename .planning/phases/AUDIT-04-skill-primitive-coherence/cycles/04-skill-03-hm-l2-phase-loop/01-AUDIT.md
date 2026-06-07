# AUDIT-04 Cycle 3 — Stage 1 RED Audit

**Cycle ID**: 04-skill-03
**Old name**: `hm-l2-phase-loop` (162 LOC, 20 inbound files)
**Sibling**: `iterative-loop` (unprefixed, 270 LOC, 2 inbound files)
**New name**: `hm-loop-phase` (HM STRICT, prefix `hm-loop-*`)
**Date**: 2026-06-07

## 1. Knowledge delta

Per 04-03 §2.1: `hm-loop-*` is canonical. `hm-l2-phase-loop` has F01 residual prefix. `iterative-loop` is the framework-agnostic foundation; merge both. GSD G.8 → gsd-execute-phase. Per 04-03 §3.6 row 11/12, `hm-l2-phase-execution` is also a separate skill (will be its own row in C3 follow-up, not in this cycle — user prompt listed 5 specific merges).

## 2. Anti-patterns

- `hm-l2-phase-loop` self-name + `consumed-by: [hm-l2-guardian]` (F01)
- Cross-references to `hm-planning-persistence` (renamed in C2) and `hm-phase-execution` (separate cycle)
- Phantom `hm-l2-guardian` and `hm-l2-operator` in `consumed-by` of hm-l2-phase-loop

## 3. Broken references

`hm-l2-phase-loop`: **20 files / 29 occurrences**
`iterative-loop`: **2 files / 2 occurrences**
**Total: 22 unique files / 31 occurrences**

## 4. 5-realm baseline

| Realm | Score |
|---|---|
| spec-driven | 2 |
| test-driven | 2 |
| doc-driven | 2 |
| arch-driven | 2 |
| clean-code-driven | 2 |
| **Total** | **10/15** (target lift ≥12) |

## 5. Risk tier

Per 04-03 §7.1: hm-l2-phase-loop not in HIGH table; actual unique file count 20 is just over MEDIUM threshold. Per user override, executed MEDIUM. Documented in CYCLEREPORT.

## 6. Done when

- [x] All 6 sub-sections present.
- [x] Inbound ref count = 22 unique / 31 occurrences.
- [x] 5-realm baseline scored.
- [x] RED test assertions recorded.
- [x] Risk-tier documented.
