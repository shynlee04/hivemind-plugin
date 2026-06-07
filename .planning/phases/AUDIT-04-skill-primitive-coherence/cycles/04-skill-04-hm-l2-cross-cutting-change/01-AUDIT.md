# AUDIT-04 Cycle 4 — Stage 1 RED Audit

**Cycle ID**: 04-skill-04
**Old name**: `hm-l2-cross-cutting-change` (337 LOC, 22 inbound files, 46 occurrences)
**Sibling**: `cross-cutting-change-mgmt` (unprefixed, 232 LOC, 2 inbound files, 2 occurrences)
**New name**: `hm-cross-change` (HM STRICT, prefix `hm-cross-*`)
**Date**: 2026-06-07

## 1. Knowledge delta

- `hm-cross-*` is the canonical prefix (04-03 §2.1 row 8)
- GSD G.4: no direct GSD counterpart; closest is `gsd-debug` (preventive vs reactive governance)
- Phantoms in `consumed-by`: `hm-l2-executor` (CORRECT to `hm-executor`), `hm-l2-builder` (ABOLISH, no such agent), `hm-l2-connector` (ABOLISH, P11), `hm-l2-architect` (CORRECT to `hm-architect` per 04-03 §6.1 P5)

## 2. Anti-patterns

- F01: `hm-l2-cross-cutting-change` self-name + 4 phantom consumers
- F06 (not in body): skill body is clean
- Cross-references to `hm-test-driven-execution` (will become `hm-test-execution` in future cycle, out of C4 scope) and `hm-spec-driven-authoring` (will become `hm-spec-authoring`)

## 3. Broken references

`hm-l2-cross-cutting-change`: **22 files / 46 occurrences**
`cross-cutting-change-mgmt`: **2 files / 2 occurrences** (self + 1 terminology-map)
**Total: 24 unique files / 48 occurrences**

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

Per 04-03 §7.1 H12: `hm-l2-cross-cutting-change` is **HIGH RISK** (~21 inbound refs). Per user override, executed MEDIUM. Documented.

## 6. Done when

- [x] All 6 sub-sections.
- [x] Inbound count = 24 unique / 48 occurrences.
- [x] 5-realm baseline.
- [x] RED test assertions.
- [x] Risk tier documented.
