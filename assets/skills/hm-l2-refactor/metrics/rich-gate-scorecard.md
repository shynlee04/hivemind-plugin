# RICH Gate Scorecard: hm-refactor

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.0.0

## RICH Classification: RICH
Domain-execution workflow — decision framework for surgical vs structural refactoring with gated protocol, safety checklist, and rollback planning.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 13 | 20 | GitHub awesome-copilot refactor-plan adopted (safe sequence, dependency map, verification). addyosmani/agent-skills incremental implementation adapted (characterization tests). Solid but could use more refactoring pattern sources. |
| D2: Mindset + Procedures | 13 | 15 | Strong Iron Law ("Refactoring without tests is restructuring"). Decision tree for surgical vs structural. 5-gate refactor protocol (scope, sequence, safety, rollback, verification). |
| D3: Anti-Pattern Quality | 12 | 15 | Four anti-patterns: Behavior Changer, Testless Restructure, Mega-Commit, No-Rollback. Detection+correction for each. |
| D4: Spec Compliance | 13 | 15 | Valid frontmatter with 9 trigger phrases. Clear boundary (NOT for rewrites or trivial formatting). |
| D5: Progressive Disclosure | 12 | 15 | 151 lines with 3 references. Core taxonomy and decision tree inline. Safety checklist actionable. |
| D6: Freedom Calibration | 13 | 15 | Balanced: strict no-behavior-change rule but flexibility in choice of approach. Independence notes for non-Git projects. |
| D7: Pattern Recognition | 8 | 10 | Refactoring taxonomy pattern (surgical vs structural). Decision tree with clear criteria. Gated protocol with 5 gates. |
| D8: Practical Usability | 12 | 15 | Decision tree immediately usable. Surgical vs structural comparison table. Safety checklist actionable. Rollback protocol works in any Git project. |
| **D1-D8 Total** | **96/120 (80%)** | | **Grade: B** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | GitHub awesome-copilot refactor-plan adopted. addyosmani/agent-skills incremental implementation adapted. |
| RICH-2 | PASS | Two-pattern taxonomy (surgical vs structural) with decision tree. Gated protocol as alternative to ad-hoc refactoring. |
| RICH-3 | PASS | Cross-refs to hm-test-driven-execution, hm-debug, hm-planning-persistence with explicit boundary descriptions. |
| RICH-4 | PASS | 5-gate refactor protocol (scope map, sequence, safety net, rollback, verification). Decision tree with stop conditions. |
| RICH-5 | PASS | 3 references (refactor-taxonomy.md, safety-checklist.md, refactor-runbook.md). Evals/ with evals.json. |
| RICH-6 | PASS | Independence notes clarify non-Git fallback with copied-file checkpoints. No GSD/BMAD/HiveMind assumptions. |
| RICH-7 | PASS | Decision tree stops at behavior-altering changes. Safety checklist blocks testless restructuring. Rollback protocol with git steps. |
| RICH-8 | PASS | This scorecard. Evals/ with evals.json. Self-correction added by SE-8 (4 failure modes). |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 96/120 (B). Solid refactoring framework with gated protocol and safety guardrails. Self-correction added by SE-8.
