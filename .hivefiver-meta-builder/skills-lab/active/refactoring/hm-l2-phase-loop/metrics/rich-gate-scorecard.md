# RICH Gate Scorecard: hm-phase-loop

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.0.0

## RICH Classification: RICH
Domain-execution workflow — manages iterative phase loops with entry gates, exit criteria, stall detection, and durable cursors.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 14 | 20 | Phase 30 rich-lineage: deterministic workflow controller, durable phase cursor with termination predicates. Stall detection pattern. Issue severity levels. Some generic loop concepts. |
| D2: Mindset + Procedures | 13 | 15 | Strong loop definition with pseudocode. Durable phase cursor schema. Validation checklist with 10 items. Agent integration table. |
| D3: Anti-Pattern Quality | 12 | 15 | Four anti-patterns: Copy Loop, Silent Stall, Infinite Loop, Premature Exit. Detection+correction for each. Could use more domain-specific patterns. |
| D4: Spec Compliance | 13 | 15 | Valid frontmatter. Clear triggers ("iterative phase loops", "mid-phase interruptions"). Description answers WHAT + WHEN. |
| D5: Progressive Disclosure | 12 | 15 | 158 lines with core loop inline. Cross-refs to sibling skills. Could benefit from separate reference files for loop patterns. |
| D6: Freedom Calibration | 12 | 15 | Balanced: max 3 iterations enforced, stall detection active, exit criteria clear. Agent integration allows flexibility in executor choice. |
| D7: Pattern Recognition | 8 | 10 | Iterative loop pattern with locked paths, deltas, and composable exit criteria. Stall detection adds safety. |
| D8: Practical Usability | 12 | 15 | Pseudocode algorithm directly implementable. Durable cursor YAML schema portable. Cross-refs to hm-phase-execution and hm-planning-persistence. |
| **D1-D8 Total** | **96/120 (80%)** | | **Grade: B** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Phase 30 rich-lineage: deterministic workflow controller, composable termination predicates, durable cursor adapted from checkpointing patterns. |
| RICH-2 | PASS | Loop definition with stall detection. Issue severity levels (PASSED/INFO/WARNING/BLOCKER). Max 3 iterations with escalation. |
| RICH-3 | PASS | Cross-refs to hm-planning-persistence and hm-phase-execution with explicit boundary descriptions. |
| RICH-4 | PASS | Validation checklist with 10 items. Exit criteria (PASSED, INFO-only, max iterations). Stall detection formula. |
| RICH-5 | PASS | References via cross-refs to sibling skills. Agent integration table (intent-loop, phase-guardian, critic, builder). |
| RICH-6 | PASS | Cursor YAML is portable. Loop algorithm is language-agnostic. Cross-refs use skill names, not file paths. |
| RICH-7 | PASS | Stall detection prevents infinite loops. Max-iteration cap with escalation path. Human interrupt handling with resume pointer. |
| RICH-8 | PASS | This scorecard. Evals/ with evals.json. Self-correction with 4 failure modes + 3 edge case entries. |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 96/120 (B). Solid iterative loop management with stall detection and durable cursors.
