# RICH Gate Scorecard: hm-l2-skill-router

**Date:** 2026-04-30 | **Auditor:** gsd-executor (SE-10) | **Version:** 2.0.0

## RICH Classification: RICH
Domain-execution router — maps task domains to hm-* skill loading bundles across 12 domains with max-3-skill enforcement, depth-qualified names, multi-domain resolution, and self-correction.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 14 | 20 | Task-to-skill routing knowledge: 12 domain bundles, priority ordering, dependency chains, multi-domain resolution, exclusion rules. Depth-qualified names (l2/l3) ensure correct skill file resolution. Includes gate-* skills (gate-l3-evidence-truth). Could deepen with per-skill version constraints and cross-bundle dependency analysis. |
| D2: Mindset + Procedures | 15 | 15 | Iron law: "Max 3 skills per bundle." Clear classification protocol. Multi-domain decision tree with split rule for 3+ domains. 6 loading rules with depth qualification mandate. |
| D3: Anti-Pattern Quality | 15 | 15 | Four anti-patterns: Domain Ambiguity (3+ domains without clear primary), Wrong Router (meta-builder vs product-dev), Bundle Overload (>3 skills), Stale Dispatch (renamed/retired skill). Each with detection and correction logic. |
| D4: Spec Compliance | 14 | 15 | Valid frontmatter with lineage, routes-to (hm-* + gate-*), input-from, consumed-by. 16 trigger phrases. Clear negatives (NOT for executing skills). Cross-skill routing table with 7+ references. Depth-qualified names throughout. |
| D5: Progressive Disclosure | 14 | 15 | SKILL.md (dispatch map + loading rules) + references/routing-map.md (detailed signal tables, multi-domain combos, exclusion rules). On-load instructions for reference pre-reading. |
| D6: Freedom Calibration | 14 | 15 | 12 domains adapt to different project types. Multi-domain resolution is flexible. Does not mandate specific project structure. Exclusion rules handle non-hm-* tasks. |
| D7: Pattern Recognition | 9 | 10 | Router pattern with domain-based classification and bundle loading. Multi-domain resolution is a novel composition. 3-skill cap prevents runaway loading. Bridge between lineage-router (6 categories) and concrete skill loading (12 domains). |
| D8: Practical Usability | 14 | 15 | Routing table immediately usable. Multi-domain combo table provides quick resolution. Loading order is explicit per bundle. Depth-qualified names prevent stale references. |
| **D1-D8 Total** | **109/120 (91%)** | | **Grade: A** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Task-to-skill routing: 12 domains, priority ordering, dependency chains, multi-domain resolution. |
| RICH-2 | PASS | Three routing strategies: single-domain bundle, multi-domain resolution (primary + secondary add), 3+ domain split with subtask decomposition. |
| RICH-3 | PASS | Cross-refs to 7 sibling skills + 19 domain skill references across 12 domains. |
| RICH-4 | PASS | 6 loading rules. Multi-domain decision tree. Domain overlap resolution. Iron law enforcement. |
| RICH-5 | PASS | Progressive disclosure: SKILL.md (routing + rules) + references/routing-map.md (signal tables, combos, exclusions). |
| RICH-6 | PASS | Domain-based routing works across project types. Multi-domain resolution handles complex tasks. Exclusion rules handle non-hm-* intents. |
| RICH-7 | PASS | Self-correction with 4 anti-patterns. Honest about being a router only — does not execute skills. Wrong Router pattern routes to sibling hf-l2-skill-router. |
| RICH-8 | PASS | This scorecard. Evals with 6 scenarios. Self-correction with 4 anti-patterns. |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 109/120 (A). Task-to-skill router with 12 domain bundles, multi-domain resolution, 3-skill cap enforcement, depth-qualified names, and structured exclusion rules. Enables hm-* ecosystem skill loading without overloading agent context.
