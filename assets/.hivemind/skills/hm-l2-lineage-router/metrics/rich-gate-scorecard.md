# RICH Gate Scorecard: hm-lineage-router

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-5) | **Version:** 1.0.0

## RICH Classification: RICH
Domain-execution router — maps task intents to hm-* skill loading bundles across 6 categories with max-5-skill enforcement and multi-category resolution.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 13 | 20 | Task-to-skill routing knowledge: 6 category bundles, priority ordering, dependency chains, multi-category resolution, exclusion rules. Could deepen with per-skill loading prerequisites and cross-bundle dependency analysis. |
| D2: Mindset + Procedures | 15 | 15 | Iron law: "Max 5 skills per bundle." Clear classification protocol. Multi-category decision tree with split rule for 3+ categories. |
| D3: Anti-Pattern Quality | 14 | 15 | Four anti-patterns: Overloading (>5 skills), Wrong Lineage (hf-* vs hm-*), Missing Input (unclassifiable task), Stale Bundles (missing critical skill). Each with detection and correction. |
| D4: Spec Compliance | 14 | 15 | Valid frontmatter with lineage, routes-to, input-from, consumed-by. 12 trigger phrases. Clear negatives (NOT for executing skills). Cross-skill routing table with 13+ references. |
| D5: Progressive Disclosure | 14 | 15 | SKILL.md (routing map + loading rules) + references/routing-map.md (detailed signal tables, multi-category combos, exclusion rules). On-load instructions for reference pre-reading. |
| D6: Freedom Calibration | 14 | 15 | 6 categories adapt to different project types. Multi-category resolution is flexible. Does not mandate specific project structure. Exclusion rules handle non-hm-* tasks. |
| D7: Pattern Recognition | 9 | 10 | Router pattern with category-based classification and bundle loading. Multi-category resolution is a novel composition. 5-skill cap prevents runaway loading. |
| D8: Practical Usability | 14 | 15 | Routing table immediately usable. Multi-category combo table provides quick resolution. Loading order is explicit per bundle. |
| **D1-D8 Total** | **107/120 (89%)** | | **Grade: A-** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Task-to-skill routing: 6 categories, priority ordering, dependency chains, multi-category resolution. |
| RICH-2 | PASS | Three routing strategies: single-category bundle, multi-category resolution (primary + secondary add), 3+ category split with subtask decomposition. |
| RICH-3 | PASS | Cross-refs to 13+ sibling skills across 6 bundles + 4 consumer skills (coordinating-loop, phase-execution, phase-loop, subagent-delegation-patterns). |
| RICH-4 | PASS | 6-step classification protocol. Multi-category decision tree. Exclusion rules. Iron law enforcement. |
| RICH-5 | PASS | Progressive disclosure: SKILL.md (routing + rules) + references/routing-map.md (signal tables, combos, exclusions). |
| RICH-6 | PASS | Category-based routing works across project types. Multi-category resolution handles complex tasks. Exclusion rules handle non-hm-* intents. |
| RICH-7 | PASS | Self-correction with 4 anti-patterns. Honest about being a router only — does not execute skills. |
| RICH-8 | PASS | This scorecard. Evals with 6 scenarios. Self-correction with 4 anti-patterns. |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 107/120 (A-). Task-to-skill router with 6 category bundles, multi-category resolution, 5-skill cap enforcement, and structured exclusion rules. Enables hm-* ecosystem skill loading without overloading agent context.
