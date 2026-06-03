# RICH Gate Scorecard: hf-skill-router

**Date:** 2026-04-30 | **Auditor:** gsd-executor (SE-10) | **Version:** 1.0.0

## RICH Classification: RICH
Domain-execution router — maps meta-builder task domains to hf-* skill loading bundles across 8 domains with max-3-skill enforcement, FLEXIBLE hm-* cross-routes, and documented lineage boundary.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 13 | 20 | Meta-builder routing: 8 domain bundles, FLEXIBLE cross-routes (hm-l2-refactor, hm-l3-synthesis) with justification. Covers agent building, skill authoring, command dev, tool building, audit, refactor, synthesis, delegation. |
| D2: Mindset + Procedures | 14 | 15 | Iron law: "Max 3 skills per bundle." 7 loading rules. FLEXIBLE cross-routing justification requirement. |
| D3: Anti-Pattern Quality | 14 | 15 | Four anti-patterns: Domain Ambiguity, Wrong Router, Unjustified Cross-Routing, Bundle Overload. |
| D4: Spec Compliance | 13 | 15 | Valid frontmatter. 16 trigger phrases. 9 cross-references. FLEXIBLE lineage designation. |
| D5: Progressive Disclosure | 14 | 15 | SKILL.md + references/routing-map.md with signal tables and exclusion rules. |
| D6: Freedom Calibration | 14 | 15 | 8 domains adapt. FLEXIBLE lineage bridges hm-* gaps safely. |
| D7: Pattern Recognition | 9 | 10 | Router pattern. FLEXIBLE cross-lineage routing is novel composition. |
| D8: Practical Usability | 13 | 15 | Routing table usable. FLEXIBLE cross-routes documented with justification. |
| **D1-D8 Total** | **104/120 (87%)** | | **Grade: B+** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | 8 domains, priority ordering, FLEXIBLE cross-routes. |
| RICH-2 | PASS | Single-domain, multi-domain, FLEXIBLE cross-routes. |
| RICH-3 | PASS | 9 sibling skills + 8 domain skills referenced. |
| RICH-4 | PASS | 7 loading rules. Decision tree. Lineage boundary protocol. |
| RICH-5 | PASS | Progressive disclosure via SKILL.md + references. |
| RICH-6 | PASS | Domain-based routing. FLEXIBLE lineage for coverage gaps. |
| RICH-7 | PASS | 4 anti-patterns. Two documented FLEXIBLE cross-routes. |
| RICH-8 | PASS | This scorecard. 6 eval scenarios. |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 104/120 (B+). Meta-builder skill router with 8 domain bundles, FLEXIBLE hm-* cross-routes, documented lineage boundary.
