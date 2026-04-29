# RICH Gate Scorecard: hm-tech-context-compliance

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-3) | **Version:** 1.0.0

## RICH Classification: RICH
Domain-execution validation workflow — validates library/framework/SDK compatibility against project tech stack.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 16 | 20 | Strong: auto-detection patterns for 9 ecosystems, compatibility check phases, cross-stack conflict types. Some ecosystem detection knowledge is lookup-table style (Claude knows most). |
| D2: Mindset + Procedures | 13 | 15 | Shapes validation thinking: "The Iron Law" frames the skill. Detection ordering prevents wasted effort. Validation loop with max-3-iteration guard. |
| D3: Anti-Pattern Quality | 14 | 15 | Strong anti-patterns: Blind Add, Version Guess, Ecosystem Confusion, SDK Handwave, Silent Overlap, Monorepo Blind Spot, Stale Doc. Each with detection and correction. |
| D4: Spec Compliance | 14 | 15 | Valid frontmatter. Description answers WHAT + WHEN + KEYWORDS with 12+ trigger phrases. Clear NOT clause. |
| D5: Progressive Disclosure | 14 | 15 | 293 lines SKILL.md, 4 references with Quick Jump table and conditional loading. Detection ordering embedded in workflow. |
| D6: Freedom Calibration | 13 | 15 | Appropriate for validation task. Structured phases with detection ordering. Adapter notes for multiple environments. |
| D7: Pattern Recognition | 9 | 10 | Tool pattern with decision tree, detection ordering, and validation loop. |
| D8: Practical Usability | 13 | 15 | Auto-detect commands, compatibility check workflow, edge case table. Minor: some ecosystem detection could be more automated with bundled scripts. |
| **D1-D8 Total** | **106/120 (88%)** | | **Grade: A** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Detection patterns synthesized from 9 ecosystem manifest file conventions. Cross-refs to hm-deep-research for library evaluation. |
| RICH-2 | PASS | Decision tree covers 5 query types with distinct workflow paths. |
| RICH-3 | PASS | Cross-refs to 5 sibling skills. Upstream/downstream pipeline documented in frontmatter. |
| RICH-4 | PASS | Explicit routing: "Is this library safe to add?" → full check; "What stack?" → auto-detect. |
| RICH-5 | PASS | 4 domain-specific references (compatibility-rules.md, detection-patterns.md, report-template.md, sdk-compliance-checks.md). |
| RICH-6 | PASS | Paths use `<project-root>/` with framework adapter notes (HiveMind→.hivemind/, GSD→.planning/, generic→evidence/). |
| RICH-7 | PASS | hm-tech-stack-ingest documented as future (SE-4). Boundary rules clarify scope. |
| RICH-8 | PASS | This scorecard. Evals/ with 3 scenarios. Self-correction section with 4 failure modes. |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 106/120 (A).
