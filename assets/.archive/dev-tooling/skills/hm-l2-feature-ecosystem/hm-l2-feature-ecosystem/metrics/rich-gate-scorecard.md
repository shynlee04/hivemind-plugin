# RICH Gate Scorecard: hm-feature-ecosystem

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-3.5) | **Version:** 1.0.0

## RICH Classification: RICH
Domain-execution workflow — designs feature interdependence: dependency graphs, cycle detection, impact propagation, delivery ordering, interface contract design.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 16 | 20 | Three-source synthesis: dependency-audit@agensi.io (cross-referencing), topological-sort/DAG patterns (ordering), interface contract patterns (API design). Four edge types (Data/Interface/Temporal/Deployment). Deep domain expertise in feature system design. |
| D2: Mindset + Procedures | 14 | 15 | Hard gate: "No Implementation Without Validated Ecosystem." 6-phase workflow (Build Graph → Validate → Impact → Order → Contracts → Handoff). Explicit pause points for user confirmation (2.4, 5.3). |
| D3: Anti-Pattern Quality | 14 | 15 | Eight anti-patterns: Single-feature scope, Hidden dependency, Fake independence, Intuition ordering, Skipping contracts, Ignoring transitive impact, Equal dependencies, Circular workaround. Each with detection and correction. |
| D4: Spec Compliance | 14 | 15 | Valid frontmatter. 10+ trigger phrases. Clear negatives (NOT for single-feature, code-level analysis, or roadmap). Routing table with 9 entries. |
| D5: Progressive Disclosure | 14 | 15 | 428 lines SKILL.md, 4 references loaded on-demand (dependency-graph-guide, impact-propagation, ordering-strategies, interface-contracts). Decision tree for routing. Quick reference table. |
| D6: Freedom Calibration | 13 | 15 | Balanced: strict phases and gates but user override channels (ordering strategies with risk/value/dependency-first options). Framework adapters for GSD/BMAD/OpenCode/generic. |
| D7: Pattern Recognition | 9 | 10 | Ecosystem design pattern with formal phases, gate checks, and pause points. Clear entry/exit criteria with decision tree. |
| D8: Practical Usability | 13 | 15 | Decision tree, routing table, dependency matrix template, impact propagation example, wave plan template. Minor: some contract writing paths reference `.planning/` conventions. |
| **D1-D8 Total** | **107/120 (89%)** | | **Grade: A** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Three inspected sources with adopt/adapt decisions: dependency-audit@agensi.io (cross-referencing), topological-sort (DAG delivery), interface contract patterns (API design). |
| RICH-2 | PASS | Three pattern alternatives: data/interface/temporal/deployment edge types, cycle detection with resolution options, contract-first interface design. Explicit adopt/adapt/reject choices. |
| RICH-3 | PASS | Cross-refs to 9+ sibling skills in routing table (hm-brainstorm, hm-cross-cutting-change, hm-roadmap-maintainability, etc.). Boundary rules with 8 nearby workflow entries. |
| RICH-4 | PASS | 6-phase workflow with explicit gates. Two user-confirmation pause points (2.4, 5.3). Cycle detection blocks Phase 3 until resolved. |
| RICH-5 | PASS | 4 domain-specific references (dependency-graph-guide, impact-propagation, ordering-strategies, interface-contracts). Decision tree for when to load references. |
| RICH-6 | PASS | Framework adapter table covers GSD/BMAD/OpenCode/generic. Paths use `<project-root>/` notation. |
| RICH-7 | PASS | Decision tree handles 2+ features and missing graph states. Router table documents routing for single-feature, code-level, and roadmap-boundary cases. |
| RICH-8 | PASS | This scorecard. Evals/ with 3 scenarios. Self-correction with 4 failure modes. |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 107/120 (A). Excellent feature ecosystem design skill with rigorous dependency modeling and comprehensive validation gates.
