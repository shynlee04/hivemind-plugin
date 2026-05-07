# RICH Gate Scorecard: hm-phase-execution

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.0.0

## RICH Classification: RICH
Orchestrator skill — executes GSD-style phase plans with wave-based parallelization, checkpoint recovery, and file-backed execution state machine.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 14 | 20 | Nanostack conductor claim/dependency/artifact pattern adapted. Reinforced deterministic plan identifiers. File-backed state machine with durable state artifacts. Some GSD conventions assumed. |
| D2: Mindset + Procedures | 13 | 15 | Strong Iron Law ("phase is a DAG of plans grouped into waves"). 5-step protocol with gates. Wave-by-wave execution. Checkpoint recovery with 4-step recovery order. |
| D3: Anti-Pattern Quality | 12 | 15 | Four anti-patterns: Todo Lister, Silent Skip, Re-Executer, Uncommitted Wave. Solid but could use more platform-specific patterns. |
| D4: Spec Compliance | 14 | 15 | Valid frontmatter with 10+ trigger phrases. Clear boundary (NOT for single-task execution). Description answers WHAT + WHEN + KEYWORDS. |
| D5: Progressive Disclosure | 12 | 15 | 191 lines with 2 references + 1 state template. Core protocol inline, details deferred. Could benefit from more reference breakdown. |
| D6: Freedom Calibration | 12 | 15 | Appropriate rigidity for phase execution. Independence notes clarify non-GSD usage. File-backed state machine adds robustness without over-constraining. |
| D7: Pattern Recognition | 8 | 10 | Wave-based parallelization pattern with DAG validation. Clear step protocol with gates and failure handling. |
| D8: Practical Usability | 12 | 15 | Checkpoint recovery protocol is actionable. Failure handling table covers all states. Some paths reference GSD conventions (.planning/). |
| **D1-D8 Total** | **97/120 (81%)** | | **Grade: B+** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Nanostack conductor claim/dependency pattern adapted. GitHub awesome-copilot plan identifiers adopted. Third-party synthesis documented. |
| RICH-2 | PASS | Wave protocol with dependency validation. Parallel where independent, serial where dependent. |
| RICH-3 | PASS | Cross-refs to hm-coordinating-loop, hm-planning-persistence, hm-phase-loop, hm-subagent-delegation-patterns with boundary descriptions. |
| RICH-4 | PASS | 5-step protocol with gates. Failure handling table (FAIL, BLOCKED, NEEDS_CONTEXT actions). Claim/stale-lock detection. |
| RICH-5 | PASS | 2 references (wave-protocol.md, checkpoint-recovery.md) + execution-state-template.md. Evals/ with evals.json. |
| RICH-6 | PASS | Independence notes clarify non-GSD usage. State paths use .opencode/state/ with documented adapter path. |
| RICH-7 | PASS | Dependency validation step detects circular dependencies. Recovery order handles claim inspection before re-execution. |
| RICH-8 | PASS | This scorecard. Evals/ with evals.json. Self-correction with 4 failure modes + 3 edge cases. |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 97/120 (B+). Solid phase execution skill with file-backed state machine and wave-based parallelization.
