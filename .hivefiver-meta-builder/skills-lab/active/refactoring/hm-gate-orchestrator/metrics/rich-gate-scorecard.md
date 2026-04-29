# RICH Gate Scorecard: hm-gate-orchestrator

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-5) | **Version:** 1.0.0

## RICH Classification: RICH
Domain-execution orchestrator — routes phase validation through the quality gate triad (lifecycle → spec → evidence) in fixed order with HALT-on-FAIL at each gate.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 14 | 20 | Quality gate triad orchestration knowledge: lifecycle mutation authority, spec traceability, evidence hierarchy, HALT-on-FAIL pipeline, remediation report structure. Gate context types (code-review, phase-audit, milestone, deployment). Could deepen with gate-specific failure mode catalogs. |
| D2: Mindset + Procedures | 15 | 15 | Iron law: "Gates execute in fixed order. No gate is skipped." 6-step pipeline with explicit PASS/FAIL branches. Remediation report template. Resume protocol from Gate 1. |
| D3: Anti-Pattern Quality | 14 | 15 | Four anti-patterns: Skipped Gate, Wrong Order, Mock as Evidence, Gate Shopping. Each with detection signal and correction action. |
| D4: Spec Compliance | 14 | 15 | Valid frontmatter with lineage, routes-to, input-from, consumed-by. 12 trigger phrases. Clear negatives (NOT for individual gate execution or deployment). Cross-skill routing table with 7 entries. |
| D5: Progressive Disclosure | 13 | 15 | SKILL.md contains pipeline definition. references/gate-flow.md has detailed flow diagram, decision points, context types, resume protocol. Single reference file — could expand to gate-specific details. |
| D6: Freedom Calibration | 14 | 15 | Gate context types adapt to different project workflows. Does not mandate specific testing tools. Remediation plan is structured but not prescriptive about fix approach. |
| D7: Pattern Recognition | 9 | 10 | Pipeline orchestrator pattern with HALT-on-FAIL. Three-gate triad is a novel composition of existing gate skills. Integration with consumer skills via routing table. |
| D8: Practical Usability | 13 | 15 | Remediation report template immediately usable. Gate context classification is practical. Could benefit from example verdict outputs for each context type. |
| **D1-D8 Total** | **106/120 (88%)** | | **Grade: A-** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Quality gate triad orchestration: lifecycle mutation authority, spec traceability, evidence hierarchy, HALT-on-FAIL pipeline. |
| RICH-2 | PASS | Three pipeline failure handling alternatives: HALT with remediation, resume-after-fix from Gate 1, gate-shopping prevention. |
| RICH-3 | PASS | Cross-refs to 7 sibling skills (3 gate skills + 3 consumer skills + hm-lineage-router). |
| RICH-4 | PASS | 6-step pipeline with explicit PASS/FAIL branches. Iron law as ordering enforcement. Decision points in gate-flow.md. |
| RICH-5 | PASS | Progressive disclosure: SKILL.md (pipeline) + references/gate-flow.md (detailed flow diagram, context types, resume protocol). |
| RICH-6 | PASS | Gate context types (code-review, phase-audit, milestone, deployment) adapt to different project workflows. |
| RICH-7 | PASS | Self-correction with 4 anti-patterns. Honest about being an orchestrator — delegates to gate skills. |
| RICH-8 | PASS | This scorecard. Evals with 6 scenarios. Self-correction with 4 anti-patterns. |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 106/120 (A-). Quality gate triad orchestrator with strict ordering enforcement, HALT-on-FAIL pipeline, and structured remediation. Resolves 3 dead references (hm-production-readiness, hm-requirements-analysis, hm-roadmap-maintainability).
