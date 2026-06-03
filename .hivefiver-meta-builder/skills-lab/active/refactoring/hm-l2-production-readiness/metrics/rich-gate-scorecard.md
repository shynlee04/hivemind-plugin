# RICH Gate Scorecard: hm-production-readiness

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-3.5) | **Version:** 1.0.0

## RICH Classification: RICH
Domain-execution workflow — bridges implementation completion to production deployment through 9-step verification of changelogs, migrations, rollback plans, monitoring, compatibility, smoke tests, deployment checklists, evidence classification, and verdict rendering.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 15 | 20 | Deep deployment safety knowledge: changelog curation, UP/DOWN migration reversibility, rollback trigger conditions, L1-L5 evidence hierarchy, monitoring instrumentation, backward compatibility contracts. Reference-backed patterns. Some adaptation to 2026 deployment tooling could deepen. |
| D2: Mindset + Procedures | 15 | 15 | Iron law: "No code ships to production without verified changelog, reversible migrations, tested rollback, and monitoring." 9-step checklist with explicit gates. Evidence-to-L1-L5 classification pipeline. |
| D3: Anti-Pattern Quality | 14 | 15 | Eight anti-patterns: Documentation-as-evidence, Missing rollback plan, Untested migrations, Mock-only integration tests, No monitoring, Changelog-by-git-log, Forward-only thinking, Environment drift. Each with detection and correction. |
| D4: Spec Compliance | 14 | 15 | Valid frontmatter. 10+ trigger phrases. Clear negatives (NOT for deployment execution or infrastructure management). Cross-skill routing table with 6 entries. |
| D5: Progressive Disclosure | 14 | 15 | 319 lines SKILL.md, 4 references loaded on-demand (deployment-checklist, migration-validation, evidence-collection-guide, rollback-plan-template). On-load instructions for reference pre-reading. |
| D6: Freedom Calibration | 14 | 15 | Adapter notes for multiple deployment targets (cloud, on-prem, serverless, CLI, npm). Does not mandate specific tools. PASS/FAIL verdict with structured remediation. |
| D7: Pattern Recognition | 9 | 10 | Verification-gate pattern with 9-step checklist, evidence classification, and verdict rendering. Explicit integration with gate-evidence-truth for terminal verdict. |
| D8: Practical Usability | 14 | 15 | Evidence report template immediately usable. Adapter notes per deployment target. Concrete checks ("git diff", health check endpoints). On-load instructions guide reference pre-reading. |
| **D1-D8 Total** | **109/120 (91%)** | | **Grade: A** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Deployment safety knowledge synthesized from operational patterns: changelog discipline, migration reversibility, rollback testing, monitoring instrumentation, evidence classification. |
| RICH-2 | PASS | Three deployment safety pattern alternatives: changelog vs git-log, UP/DOWN migration reversibility, L1-L5 evidence hierarchy with VERDICT pipeline. |
| RICH-3 | PASS | Cross-refs to 6+ sibling skills (hm-feature-ecosystem, hm-cross-cutting-change, gate-evidence-truth, hm-gate-orchestrator, hm-brainstorm, hm-spec-driven-authoring). |
| RICH-4 | PASS | 9-step verification workflow with explicit gates. Iron law as entry guard. On-load pre-reading instructions. PASS/FAIL verdict with remediation plan. |
| RICH-5 | PASS | 4 domain-specific references (deployment-checklist, migration-validation, evidence-collection-guide, rollback-plan-template). On-load instructions for pre-reading. |
| RICH-6 | PASS | Adapter notes per deployment target (cloud, on-prem, serverless, CLI, npm, mobile backends). Does not assume specific hosting provider. |
| RICH-7 | PASS | Documented missing skill routing (hm-gate-orchestrator — SE-5 deliverable). Router table handles predecessors and consumers. |
| RICH-8 | PASS | This scorecard. Evals/ with 3 scenarios. Self-correction with 4 failure modes (target unclear, insufficient evidence, impractical rollback, adapter switching). |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 109/120 (A). Outstanding production readiness skill with comprehensive deployment safety verification, multi-target adapter notes, and rigorous evidence classification.
