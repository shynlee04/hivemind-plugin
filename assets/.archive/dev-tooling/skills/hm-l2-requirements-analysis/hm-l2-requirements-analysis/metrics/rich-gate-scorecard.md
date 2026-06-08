# RICH Gate Scorecard: hm-requirements-analysis

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-3) | **Version:** 1.0.0

## RICH Classification: RICH
Domain-execution workflow — formal requirements diagnosis (gap detection, contradiction surfacing, constraint discovery).

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 17 | 20 | Strong expert knowledge: 4 diagnostic lenses, EARS translation, Five Whys, constraint dimensions taxonomy. Minimal generic advice. |
| D2: Mindset + Procedures | 14 | 15 | Shapes diagnostic thinking ("answers four questions about every requirement"). Lens-based approach with systematic procedures. |
| D3: Anti-Pattern Quality | 14 | 15 | Excellent anti-patterns with detection + correction. Covers diagnosing-without-source, writing-instead-of-diagnosing, vague-term acceptance, treating-all-gaps-equally. |
| D4: Spec Compliance | 14 | 15 | Valid frontmatter. Description answers WHAT + WHEN + KEYWORDS with 10+ trigger phrases. Clear NOT clauses. |
| D5: Progressive Disclosure | 14 | 15 | 258 lines SKILL.md, 3 references with loading guidance in body. Gate system controls workflow ordering. |
| D6: Freedom Calibration | 13 | 15 | Appropriate for analytical task. Structured lenses provide rigor without over-constraining. Severity classification prevents equal-treatment error. |
| D7: Pattern Recognition | 9 | 10 | Process pattern with 4-step workflow and 5-gate system. Entry/exit criteria clear. |
| D8: Practical Usability | 14 | 15 | Diagnostic table columns, quick reference, edge case handling. Minor: hm-gate-orchestrator reference is future (SE-5). |
| **D1-D8 Total** | **109/120 (91%)** | | **Grade: A** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Third-party synthesis: skillmd.ai/requirements-clarity, agent-skills.md/prompt-optimizer, forztf/open-skilled-sdd. |
| RICH-2 | PASS | Three patterns with explicit adopt/adapt decisions. |
| RICH-3 | PASS | Cross-refs to 4 sibling skills, entry gate routing, boundary rules. |
| RICH-4 | PASS | Handoff routing to hm-spec-driven-authoring, hm-brainstorm. Gate system controls flow. |
| RICH-5 | PASS | 3 domain-specific references (ears-syntax-guide.md, gap-detection-patterns.md, needs-vs-wants.md). |
| RICH-6 | PASS | No hardcoded local paths. Portable diagnostic methodology. |
| RICH-7 | PASS | Gap documentation: hm-gate-orchestrator marked as [Future: SE-5]. |
| RICH-8 | PASS | This scorecard. Evals/ with 3 scenarios. Self-correction section with 4 failure modes. |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 109/120 (A).
