# RICH Gate Scorecard: hm-skill-router

**Date:** 2026-04-30 | **Auditor:** gsd-executor (SE-10) | **Version:** 1.0.0

## RICH Classification: RICH
Domain-execution dispatch router — maps 12 agent task domains to concrete hm-* skill loading bundles with priority ordering, max-3-skill enforcement, multi-domain resolution, and overlap signal tables.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 14 | 20 | Domain-to-skill dispatch: 12 task domains, priority ordering per bundle, dependency chains, multi-domain resolution, overlap resolution table with 8 entries, verb+noun signal qualification. Could deepen with per-skill loading prerequisites and context-budget-aware dispatch optimization. |
| D2: Mindset + Procedures | 14 | 15 | Iron law: "Max 3 skills per bundle. Priority ordering is binding." 5 loading rules. Multi-domain resolution decision tree. Bundle size limits with rationale. |
| D3: Anti-Pattern Quality | 14 | 15 | Four anti-patterns: Domain Ambiguity (3+ domain match), Wrong Router (meta-builder vs product-dev), Bundle Overload (>3 skills), Stale Dispatch (missing skill). Each with detection logic, correction action, and signal text. |
| D4: Spec Compliance | 14 | 15 | Valid frontmatter with lineage, routes-to, input-from, consumed-by. 12 trigger phrases. Clear negatives (NOT for executing skills). 17+ skill references across 12 domain bundles and 5 cross-refs. |
| D5: Progressive Disclosure | 14 | 15 | SKILL.md (dispatch map + loading rules + domain-to-lineage routing) + references/routing-map.md (detailed signal tables, 12 signal-to-bundle tables, overlap resolution matrix, bundle size limits). On-load instructions for reference pre-reading. |
| D6: Freedom Calibration | 13 | 15 | 12 domains cover all product-dev workflows (brainstorm to closure). Multi-domain resolution provides flexibility. 3-skill cap preserves context budget. Verb+noun signal qualification enables precise matching. Slightly prescriptive in domain mapping — could benefit from user-overridable dispatch hints. |
| D7: Pattern Recognition | 9 | 10 | Dispatch router pattern with granular domain-to-bundle mapping. Multi-domain resolution with priority-weighted secondary add. Overlap signal resolution table. Downstream integration from hm-lineage-router creates dual-router dispatch chain. |
| D8: Practical Usability | 14 | 15 | Dispatch table immediately usable. Signal tables provide clear trigger matching. Overlap resolution table answers "which domain when signals conflict?". Domain-to-lineage routing diagram clarifies the two-router chain. |
| **D1-D8 Total** | **106/120 (88%)** | | **Grade: A-** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Domain-to-skill dispatch: 12 domains, priority ordering, dependency chains, multi-domain resolution. |
| RICH-2 | PASS | Three dispatch strategies: single-domain, multi-domain (primary + secondary add), 3+ domain split. Overlap resolution table with 8 entries. |
| RICH-3 | PASS | Cross-refs to 17+ sibling skills across 12 domain bundles + 5 consumer/sibling skills. |
| RICH-4 | PASS | 5 loading rules. Multi-domain decision tree. Overlap resolution matrix. Bundle size limits. Iron law enforcement. |
| RICH-5 | PASS | Progressive disclosure: SKILL.md (dispatch map + rules) + references/routing-map.md (signal tables, overlap resolution, limits). |
| RICH-6 | PASS | 12 domains span all product-dev workflows. Multi-domain resolution handles complex tasks. 3-skill cap preserves context. Signal-based matching works across project types. |
| RICH-7 | PASS | Self-correction with 4 anti-patterns. Honest about being a dispatch router only. Downstream positioning documented. |
| RICH-8 | PASS | This scorecard. Evals with 7 scenarios (4 positive, 2 negative, 1 boundary). Self-correction with 4 anti-patterns. |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 106/120 (A-). Domain-to-skill dispatch router with 12 task domains, multi-domain resolution, 3-skill cap enforcement, overlap signal resolution, and integration with hm-lineage-router for dual-router dispatch. Enables precise hm-* skill loading without overloading agent context.
