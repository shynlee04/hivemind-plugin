# Phase 20 — Structural Changes (Playbook Phase 2)

**GSD Phase:** 20
**Playbook Phase:** 2
**Date:** 2026-04-23
**Status:** archived
**Archived reason:** Reclassified to skill-ecosystem workstream (SE-H4)
**Depends on:** Phase 19 (Rename Sprint) ✅ COMPLETE

---

## Purpose

Execute merge, split, and creation operations per the differential cluster gap map (CR-GAP-MAP.md) and tooling decision table (CR-DECISIONS.md). This phase delivers the structural reorganization that Phase 19's rename sprint enabled.

## Scope

### In
1. **Merge:** `session-context-manager` → `hm-planning-with-files`
2. **Split:** `harness-delegation-inspection` → `hm-subagent-delegation-patterns` + `hm-opencode-project-inspection`
3. **Create G-A skills:** `hm-completion-looping`, `hm-subagent-delegation-patterns`
4. **Create G-B skills:** `hm-spec-driven-authoring`, `hm-test-driven-execution`
5. **Create G-C skill:** `hm-research-chain`
6. **Create G-D skills:** `hm-debug`, `hm-refactor`, `hm-phase-execution`

### Out
- No description rewrites (deferred to Phase 21)
- No body quality passes (deferred to Phase 23)
- No eval expansion beyond minimum stacked scenario (deferred to Phase 23)
- No script hardening beyond basic non-zero-exit (deferred to Phase 22)

## Hard Constraints
- Zero `src/` code changes
- Zero IDE-directory modifications
- Every new skill: SKILL.md ≤500 LOC, references ≥100 LOC each, scripts non-zero-exit, evals with stacked scenario, 6-NON defence table

## Exit Criteria
- [ ] session-context-manager content merged into hm-planning-with-files; session-context-manager retired
- [ ] harness-delegation-inspection split into two skills
- [ ] 7 new skills created with minimum viable bundles
- [ ] All call-sites updated for new/retired skills
- [ ] Playbook Appendix F updated
- [ ] Committed with conventional messages

## Verification
- `ls` confirms new skill directories exist
- `validate-skill.sh` exits 0 for all new skills
- `check-overlaps.sh` passes
- No stale references to retired skills
