# RICH Gate Scorecard: hm-test-driven-execution

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.2.0

## RICH Classification: RICH
Domain-execution workflow — executes runtime-truthful RED/GREEN/REFACTOR cycles from locked requirements with honest coverage claims and blocked handoffs.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 17 | 20 | Three-source synthesis: addyosmani TDD (comprehensive TDD, Prove-It bug fix, test sizes, DAMP), helderberto TDD (one-test-at-a-time, public-interface), jellydn TDD (action/status vocabulary). Deep TDD domain knowledge. |
| D2: Mindset + Procedures | 14 | 15 | RED/GREEN/REFACTOR gates with strict evidence requirements. Prove-It pattern for bugs. Runtime-truthful testing labels. Invalid RED detection. |
| D3: Anti-Pattern Quality | 13 | 15 | Five anti-patterns: Test-After Claim, Fake Green, Mock Theater, Coverage Lie, Infinite Fix Loop. Each with detection+correction. |
| D4: Spec Compliance | 14 | 15 | Valid frontmatter with 10+ trigger phrases. Clear boundary (NOT for spec authoring). Consumes locked requirements from hm-spec-driven-authoring. |
| D5: Progressive Disclosure | 14 | 15 | 277 lines with 3 references, 1 template, 1 workflow, 1 rubric, 1 script. Gates inline, details deferred to references. |
| D6: Freedom Calibration | 13 | 15 | Strict gates (RED must fail, GREEN minimal, REFACTOR after green) but honest about missing tooling (coverage_status: MISSING). Platform adapters flexible. |
| D7: Pattern Recognition | 9 | 10 | RED/GREEN/REFACTOR pattern with gate enforcement. Prove-It sub-pattern for bugs. Test size and readability labels. |
| D8: Practical Usability | 13 | 15 | Coverage command table for Node/Python/Go. Blocked handoff YAML format. Test-case template immediately usable. |
| **D1-D8 Total** | **107/120 (89%)** | | **Grade: A** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Three inspected TDD sources with adopt/adapt decisions. Prove-It pattern, test sizes, DAMP tests, one-test-at-a-time enforcement. |
| RICH-2 | PASS | Three pattern alternatives compared: comprehensive TDD, vertical TDD, action/status vocabulary. Explicit decisions. |
| RICH-3 | PASS | Cross-refs to hm-spec-driven-authoring, hm-planning-persistence, manual QA, test-after work with explicit boundary rules. |
| RICH-4 | PASS | Entry gate with 5 preconditions. RED/GREEN/REFACTOR gates with stop conditions. Invalid RED detection table. |
| RICH-5 | PASS | 3 references (red-green-refactor, coverage-verification, source-synthesis) + template + workflow + rubric + script. |
| RICH-6 | PASS | Cross-platform adapters (OpenCode-native, Hivemind harness, arbitrary user project). Coverage command table with fallbacks. |
| RICH-7 | PASS | Blocked handoff format. Invalid RED handling stops execution. Missing coverage tooling documented honestly. |
| RICH-8 | PASS | This scorecard. Evals/ with evals.json. Self-correction with 4 failure modes + blocked handoff format. Rich-eval-rubric.json in metrics/. |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 107/120 (A). Excellent TDD execution skill with deep provenance and honest coverage handling.
