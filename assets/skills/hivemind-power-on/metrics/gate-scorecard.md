# Gate Evidence Scorecard — hivemind-power-on (refresh)

**Date:** 2026-06-08
**Cycle:** BATCH 1
**Pattern:** 1 (Mindset)
**Realm coverage:** arch, clean-code

## Changes in this refresh

1. **Frontmatter `consumed-by` field**: replaced `orchestrator (L0)/coordinator (L1)/conductor (L2)/meta-builder (L2)` (F03 violation — embedded l0/l1/l2/l3 substrings) with `hm-orchestrator/hm-coordinator/hf-coordinator/hf-meta-builder` (clean agent names).
2. **Version bump**: 2.2.0 → 2.3.0
3. **Bundle added**:
   - `scripts/validate-state.sh` — runtime state validation
   - `scripts/validate-resume.sh` — pre-flight for session resume
   - `templates/agent-work-contract-template.md` — bounded work scope
   - `templates/session-resume-pointer-template.md` — clean resume handoff
   - `workflows/session-start-checklist.md` — 8-step start sequence
   - `workflows/delegate-with-context.md` — subagent dispatch protocol
   - `evals/evals.json` — 5 governance test cases
4. **References/ kept** (8 files, no changes)

## Gate 1: Lifecycle Integration

| Check | Result | Evidence |
|---|---|---|
| 9-surface mutation authority respected | PASS | SKILL.md is L5; `validate-state.sh` is L7 read-only diagnostic; templates are L5; workflows are L5 |
| CQRS write/read boundaries | PASS | Skill READS state, never WRITES state directly |
| Forbidden-name regex (F01-F12) | PASS | F03 violation fixed; run `validate-name.sh hivemind-power-on skill` → exit 0 |
| 22-category prefix | N/A | `hivemind-*` lineage is canonical (separate from `hm-*` 22-category) |
| Tech-agnostic principle | PASS | No specific framework/language |

## Gate 2: Spec Compliance

| Check | Result | Evidence |
|---|---|---|
| Bidirectional traceability | PASS | All scripts and templates cite file paths |
| EARS acceptance criteria | N/A | This is governance, not a spec |
| Anti-patterns | PASS | 7 in original SKILL.md (over-delegation, orphan, merge-conflict, infinite retry, etc.) |
| GSD compatibility pointer | N/A | No `gsd-*` counterpart |
| 5-realm coverage | PARTIAL | arch (9-surface authority), clean-code (no anti-patterns); spec/test/doc covered by other skills |
| Risk tier assignment | N/A | First refresh; no inbound refs |

## Gate 3: Evidence Truth

| Check | Result | Evidence |
|---|---|---|
| Evidence hierarchy | L5 | Documentation-summary; L1 would require running validate-state.sh against real state |
| Coverage state | PASS | 5 evals with falsifiable assertions |
| Fresh evidence | PASS | Captured in this session, 2026-06-08 |

## Verdict: PASS (with caveat)

Skill is ready for deployment. 5-realm coverage is partial because the
governance skill is not the right place for spec/test/doc coverage; the
specialist skills (hm-spec-authoring, hm-test-driven-execution, etc.) own
those realms.
