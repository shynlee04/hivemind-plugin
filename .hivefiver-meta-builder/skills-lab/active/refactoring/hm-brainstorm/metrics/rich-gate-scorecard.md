# RICH Gate Scorecard: hm-brainstorm

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-3) | **Version:** 1.0.0

## RICH Classification: RICH
Domain-execution workflow — bridges vague intent to formal requirements brief.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 16 | 20 | Strong decision trees (when to route vs continue), YAGNI filter, assumption detection. Some generic project setup advice (check README.md, package.json). |
| D2: Mindset + Procedures | 13 | 15 | Shapes how to think about ideation (HARD GATE, Phase 1→4). Question priority matrix. One-question-at-a-time discipline. |
| D3: Anti-Pattern Quality | 14 | 15 | Excellent anti-patterns table with detection + correction. Covers question flood, jumping to implementation, over-engineering, scope creep. |
| D4: Spec Compliance | 14 | 15 | Valid frontmatter. Description answers WHAT + WHEN + KEYWORDS with 10+ trigger phrases. |
| D5: Progressive Disclosure | 14 | 15 | 298 lines SKILL.md, 3 references loaded on-demand with MANDATORY triggers. Decision tree for when to load references. |
| D6: Freedom Calibration | 13 | 15 | Appropriate for creative-exploration task. Phases provide structure but not rigidity. Max-5-question limit prevents analysis paralysis. |
| D7: Pattern Recognition | 9 | 10 | Process pattern with 4-phase workflow and gate system. Clear entry/exit criteria. |
| D8: Practical Usability | 13 | 15 | Decision tree, routing table, YAGNI filter. Minor: some framework adapter paths reference GSD conventions. |
| **D1-D8 Total** | **106/120 (88%)** | | **Grade: A** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Third-party synthesis documented: obra/superpowers@brainstorming, ratacat/claude-skills@brainstorming, Jamie-BitFlight/brainstorming-skill. Adopt/adapt decisions recorded. |
| RICH-2 | PASS | Three pattern alternatives compared with explicit adopt/adapt/reject decisions. |
| RICH-3 | PASS | Cross-refs to 5+ sibling skills, framework adapter table (GSD/BMAD/OpenCode/generic). |
| RICH-4 | PASS | Explicit routing table and boundary rules. Decision tree for when to route vs continue. |
| RICH-5 | PASS | 3 domain-specific references (assumption-detection.md, handoff-template.md, question-patterns.md). |
| RICH-6 | PASS | Framework adapter table covers GSD/BMAD/OpenCode/generic. Paths use `<project-root>/` with adapter notes. |
| RICH-7 | PASS | Router table documents missing skill routing (hm-deep-research when research needed). |
| RICH-8 | PASS | This scorecard. Evals/ with 3 scenarios. Self-correction section with 4 failure modes. |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 106/120 (A).
