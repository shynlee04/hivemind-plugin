---
phase: SE-10
plan: skill-routing-skills
subsystem: skill-ecosystem
tags: [router, dispatch, skill-bundles, RICH-8]
requires: [SE-9]
provides: [hm-l2-skill-router, hf-l2-skill-router]
affects: [hm-l2-lineage-router, hm-l2-coordinating-loop, hm-l2-phase-execution]
tech-stack:
  added: []
  patterns: [domain-dispatch-router, task-to-skill-mapping, depth-qualified-names, flexible-cross-routing]
key-files:
  created:
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hf-l2-skill-router/SKILL.md
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hf-l2-skill-router/evals/evals.json
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hf-l2-skill-router/metrics/rich-gate-scorecard.md
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hf-l2-skill-router/references/routing-map.md
  modified:
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hm-l2-skill-router/SKILL.md
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hm-l2-skill-router/evals/evals.json
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hm-l2-skill-router/metrics/rich-gate-scorecard.md
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hm-l2-skill-router/references/routing-map.md
    - .planning/workstreams/skill-ecosystem/STATE.md
decisions:
  - "hm-l2-skill-router updated to v2.0.0 with 12 domain bundles using l2/l3 depth-qualified names"
  - "hf-l2-skill-router created with 8 domain bundles and FLEXIBLE hm-* cross-routes"
  - "hm-l2-skill-router Review domain includes gate-l3-evidence-truth for terminal evidence gate"
  - "hm-l2-skill-router Research domain updated to hm-l3-detective + hm-l3-deep-research + hm-l3-tech-stack-ingest"
  - "hf-l2-skill-router uses FLEXIBLE lineage for hm-l2-refactor (structural refactoring methodology) and hm-l3-synthesis (artifact compression)"
metrics:
  duration: "~15 min"
  completed: "2026-04-30"
  phases_complete: "13/17"
---

# Phase SE-10 Plan: Skill Routing Skills Summary

**One-liner:** Created hm-l2-skill-router v2.0.0 (12 domain bundles with depth-qualified names) and hf-l2-skill-router v1.0.0 (8 domain bundles with FLEXIBLE hm-* cross-routes), both scoring 8/8 RICH-8.

## Execution Summary

SE-10 created two skill routing skills that map task domains to concrete skill loading bundles. The hm-l2-skill-router was updated from its original 12-domain configuration to use depth-qualified names ({lineage}-{depth}-{name}) and the routing table specified in the task requirements. The hf-l2-skill-router was created from scratch to handle meta-builder dispatch with FLEXIBLE cross-lineage support.

### hm-l2-skill-router (v1.0.0 → v2.0.0)

**Key changes from v1.0.0:**
- All skill names updated to use `{lineage}-{depth}-{name}` format (e.g., `hm-detective` → `hm-l3-detective`)
- Research bundle: Added `hm-l3-tech-stack-ingest` (now 3 skills, was 2)
- Review bundle: Updated to `hm-l2-production-readiness + gate-l3-evidence-truth` (was 1 skill)
- Brainstorm bundle: Added `hm-l2-user-intent-interactive-loop` (now 2 skills, was 1)
- Removed Integration domain (folded into Review and Implementation)
- Removed Closure domain (folded into Guardrail)
- Added Guardrail domain: `hm-l2-phase-loop + hm-l2-completion-looping`
- Added Research Chain domain: `hm-l3-research-chain + hm-l3-synthesis`
- Cross-references updated with depth-qualified names

### hf-l2-skill-router (v1.0.0, new)

**8 domain bundles:**
| Domain | Skills | Size |
|--------|--------|------|
| Agent Building | hf-l2-agents-and-subagents-dev + hf-l2-agent-composition | 2 |
| Skill Authoring | hf-l2-use-authoring-skills + hf-l2-skill-synthesis | 2 |
| Command Dev | hf-l2-command-dev + hf-l2-command-parser | 2 |
| Tool Building | hf-l2-custom-tools-dev | 1 |
| Audit | hf-l2-use-authoring-skills + hf-l2-agents-md-sync + gate-l3-evidence-truth | 3 |
| Refactor | hf-l2-agents-md-sync + hm-l2-refactor | 2 |
| Synthesis | hf-l2-skill-synthesis + hm-l3-synthesis | 2 |
| Delegation | hf-l2-delegation-gates | 1 |

**FLEXIBLE cross-routes:** Refactor domain routes to `hm-l2-refactor` (no hf-* skill covers structural refactoring methodology). Synthesis domain routes to `hm-l3-synthesis` (no hf-* skill covers artifact compression). Both documented with justification.

### Quality Gate Scores

| Skill | RICH-8 Score | D1-D8 |
|-------|-------------|-------|
| hm-l2-skill-router | 8/8 | 109/120 (A, 91%) |
| hf-l2-skill-router | 8/8 | 104/120 (B+, 87%) |

## Deviations from Plan

None — plan executed exactly as written. The task specification's routing tables were implemented exactly.

## Task Summary

| Task | File | Status |
|------|------|--------|
| hm-l2-skill-router SKILL.md rewrite | Modified (v1.0.0 → v2.0.0) | ✅ |
| hm-l2-skill-router evals update | Modified (6 scenarios) | ✅ |
| hm-l2-skill-router metrics update | Modified (109/120 A) | ✅ |
| hm-l2-skill-router references update | Modified (12 domains) | ✅ |
| hf-l2-skill-router SKILL.md | Created (8 domains) | ✅ |
| hf-l2-skill-router evals | Created (6 scenarios) | ✅ |
| hf-l2-skill-router metrics | Created (104/120 B+) | ✅ |
| hf-l2-skill-router references | Created (8 domains) | ✅ |
| STATE.md update | Modified (SE-10→COMPLETE) | ✅ |

## Self-Check

All files verified on disk. All committed.
