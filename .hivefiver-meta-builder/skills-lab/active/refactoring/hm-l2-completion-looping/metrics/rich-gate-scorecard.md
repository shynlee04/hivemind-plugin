# RICH Gate Scorecard: hm-completion-looping

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.0.0

## RICH Classification: RICH
Domain-execution workflow — prevents premature task completion through verification loops with durable cursors and composable termination predicates.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 15 | 20 | Rich third-party synthesis: LangGraph durable execution, AutoGen termination predicates, OpenAI guardrails/tracing. Three gates (Output, Quality, Scope) and three loop types (Verify-After, Verify-During, Guardrail). Some generic project conventions. |
| D2: Mindset + Procedures | 13 | 15 | Strong Iron Law ("task is done when verification proves it"), three-gate completion detection, self-verification envelope template. Clear verification-first mindset. |
| D3: Anti-Pattern Quality | 13 | 15 | Four well-defined anti-patterns with detection+correction: Premature Done, Infinite Loop, Silent Fix, Skipped Gate. Actionable and specific. |
| D4: Spec Compliance | 13 | 15 | Valid frontmatter with 10+ trigger phrases. Clear boundaries (NOT for one-shot tasks or simple retry loops). Description answers WHAT + WHEN + KEYWORDS. |
| D5: Progressive Disclosure | 13 | 15 | 149 lines SKILL.md with 3 references loaded on-demand. Durable cursor schema inline for quick reference. Reference map at bottom. |
| D6: Freedom Calibration | 12 | 15 | Appropriate for guardrail/verification tasks. Loop types with max iteration caps prevent abuse. Could be overly rigid for simple verification scenarios. |
| D7: Pattern Recognition | 8 | 10 | Guardrail pattern with three-gate verification system. Well-structured entry/exit criteria. Durable cursor fields for resumability. |
| D8: Practical Usability | 13 | 15 | Self-verification envelope template is immediately usable. Cursor schema is portable. Cross-refs to 3 related skills with clear boundaries. |
| **D1-D8 Total** | **100/120 (83%)** | | **Grade: B+** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Third-party synthesis: LangGraph durable execution/checkpointers, AutoGen termination conditions, OpenAI guardrails/tracing. Adopt decisions documented. |
| RICH-2 | PASS | Three pattern alternatives compared (durable cursor loop, composable termination predicates, per-edge guardrail evidence). |
| RICH-3 | PASS | Cross-refs to hm-coordinating-loop, hm-phase-loop, hm-planning-persistence with explicit boundary descriptions. |
| RICH-4 | PASS | Three gates define completion. Three loop types with max iteration caps. Explicit scope boundary (NOT for one-shot tasks). |
| RICH-5 | PASS | 3 domain-specific references (verification-checklist.md, loop-patterns.md, durable-completion-cursors.md). |
| RICH-6 | PASS | Cursor schema uses portable YAML. Self-verification envelope is platform-agnostic. Reference map at bottom. |
| RICH-7 | PASS | Cross-refs to sibling skills. Clear routing: when to use verify-after vs verify-during vs guardrail loop types. |
| RICH-8 | PASS | This scorecard. Evals/ with evals.json. Self-correction section with 4 failure modes + 3 edge case subsections. |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 100/120 (B+). Strong guardrail skill with durable cursor pattern and composable termination predicates.
