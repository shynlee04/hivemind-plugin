---
phase: SE-9
workstream: skill-ecosystem
status: COMPLETE
depends_on:
  - SE-7
  - SE-8
blocks: [] (terminal phase)
created: 2026-04-29
---

# SE-9: Final Integrity Verification — Context

## Phase Goal
Prove the entire skill ecosystem is coherent, complete, and production-ready. This is the terminal verification phase that validates all 49 active skills pass RICH gates, all cross-references resolve, and the end-to-end workflow from brainstorm → spec → TDD → artifacts → gate orchestration → triad functions correctly.

## Starting State
- SE-7 completed: all forward-phase skills (SE-1 through SE-7 deliverables) pass RICH gates
- SE-8 completed: all 25 orphan skills hardened and audited
- hm-gate-orchestrator exists (created in SE-5)
- hm-lineage-router exists (created in SE-5)
- All known dead references cleaned
- hm-planning-persistence fully replaces disabled hm-planning-with-files

## Deliverables
- Full RICH gate audit report for all 49 active skills (target: 100% PASS)
- Cross-reference integrity verification report (target: 0 broken references)
- End-to-end workflow test results across full pipeline
- Lineage routing test results (product → hm-*, meta → hf-*, stack → SDK docs)
- Final ecosystem coherence report

## Acceptance Criteria
- [ ] All 49 active skills pass RICH-1 through RICH-8 audit
- [ ] Zero broken cross-references across the entire ecosystem
- [ ] End-to-end workflow test passes: brainstorm → requirements → spec → TDD → artifacts → gate orchestration → triad → production readiness
- [ ] Lineage routing test passes: product task → hm-* chain, meta task → hf-* chain
- [ ] All 3 `hm-gate-orchestrator` references in `hm-production-readiness`, `hm-requirements-analysis`, `hm-roadmap-maintainability` resolve correctly
- [ ] `donotusethis-hm-planning-with-files` fully archived with zero remaining references
- [ ] `hf-meta-builder` frontmatter name is `hf-meta-builder` (not `hr-meta-builder`)
- [ ] Final ecosystem coherence report produced and committed

## Known Risks
- This phase is blocked until both SE-7 and SE-8 complete — any delay in either cascades here
- 49-skill audit is context-heavy — may require multi-wave execution with checkpoint persistence
- End-to-end workflow test may reveal integration gaps not visible in individual skill audits
- `hf-meta-builder` naming fix (hr- → hf-) may require updating all references to it

## Skills Needed
- `gate-evidence-truth` — terminal evidence gate for verification claims
- `gate-spec-compliance` — bidirectional traceability verification
- `gate-lifecycle-integration` — lifecycle compliance check
- `hm-deep-research` / `hm-detective` — investigation of any failures found
- `hm-synthesis` — compressing 49-skill audit results into coherence report
- All 49 active skills (audit targets)
