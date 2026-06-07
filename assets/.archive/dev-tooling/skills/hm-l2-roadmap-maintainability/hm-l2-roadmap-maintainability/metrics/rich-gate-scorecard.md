# RICH Gate Scorecard: hm-roadmap-maintainability

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-3.5) | **Version:** 1.0.0

## RICH Classification: RICH
Domain-execution workflow — evaluates product roadmaps through a maintainability lens: hex-dimension scoring, dependency-ordered milestones, extensibility verification, technical debt tracking, and product health dashboards.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 16 | 20 | Four-source synthesis: skillmd.ai/roadmap-planner (milestone ordering), AdamPaternostro/agent-skills@maintainability-scorer (hex-dimension scoring), phodal/tech-debt (quadrant model + interest calculation), SAFe Architecture Runway (pre-enablement). Deep maintainability domain expertise. |
| D2: Mindset + Procedures | 14 | 15 | 8-phase workflow (Intake→Score→Order→Extensibility→Debt→Health→Capacity→Report). Maintainability Index formula with weights. Debt quadrant model (Deliberate/Inadvertent × Prudent/Reckless). |
| D3: Anti-Pattern Quality | 14 | 15 | Six anti-patterns: Optimism bias, Debt denial, Milestone compression, Architecture blindness, Score inflation, Dependency wishful thinking. Five dependency anti-patterns in Phase 3. Each with detection and correction. |
| D4: Spec Compliance | 14 | 15 | Valid frontmatter. 10+ trigger phrases. Clear NOT-statement routing to hm-feature-ecosystem and hm-brainstorm. Routing table with 7 entries. |
| D5: Progressive Disclosure | 14 | 15 | 508 lines SKILL.md, 4 references loaded on-demand (maintainability-scoring, roadmap-patterns, debt-tracking, extensibility-checks). Quick Jump table. Decision tree. |
| D6: Freedom Calibration | 13 | 15 | Framework adapters for GSD/BMAD/OpenCode/Scrum/generic. Block/unblock logic for missing artifacts. Honest "ask for features" rather than inventing them. |
| D7: Pattern Recognition | 9 | 10 | Roadmap evaluation pattern with formal phases and milestone dependency ordering. Maintainability Index formula. Health dashboard template. |
| D8: Practical Usability | 13 | 15 | Health dashboard template immediately usable. Debt interest calculation formula (Principal × (1+Rate)^milestones). Roadmap report with 9 structured sections. Minor: some GSD-specific paths. |
| **D1-D8 Total** | **107/120 (89%)** | | **Grade: A** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Four inspected sources with adopt/adapt decisions: skillmd.ai (milestone ordering), AdamPaternostro (hex scoring), phodal/tech-debt (quadrant + interest), SAFe Architecture Runway (pre-enablement). |
| RICH-2 | PASS | Four pattern alternatives: hex-dimension maintainability scoring, debt quadrant classification, topological milestone ordering, architecture extensibility checks. Explicit adopt/adapt/reject choices. |
| RICH-3 | PASS | Cross-refs to 7+ sibling skills in routing table. Boundary rules with 7 nearby workflow entries including hm-feature-ecosystem (near-term vs long-term boundary). |
| RICH-4 | PASS | 8-phase workflow with explicit gates. Roadmap maturity classification (Incomplete/Draft/Formal). Dependency anti-pattern detection in Phase 3. Debt interest-on-principal formula. |
| RICH-5 | PASS | 4 domain-specific references (maintainability-scoring, roadmap-patterns, debt-tracking, extensibility-checks). Quick Jump table for on-demand loading. |
| RICH-6 | PASS | Framework adapter table covers GSD/BMAD/OpenCode/Scrum/generic. Milestone terminology used (not Sprint/PI). |
| RICH-7 | PASS | Decision tree handles missing artifacts with explicit surface-and-block behavior. Router table handles near-term feature design (hm-feature-ecosystem) and ideation (hm-brainstorm). |
| RICH-8 | PASS | This scorecard. Evals/ with 3 scenarios. Self-correction with 4 failure modes. |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 107/120 (A). Comprehensive roadmap maintainability skill with rigorous scoring methodology, debt tracking with interest calculation, and full product health dashboard.
