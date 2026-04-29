# Phase SE-3.5: Feature Ecosystem & Production Skills — CONTEXT

**Workstream:** skill-ecosystem
**Phase:** SE-3.5 (inserted between SE-3 and SE-4)
**Depends on:** SE-2 (artifact hierarchy) — can run parallel with SE-3
**Status:** DRAFT — awaiting discuss-phase authorization

## Problem (from original prompt)

> "features work as an ecosystem, they are cross-cuttings, they are cross-dependencies; they are of different concerns and having complex cross architectures"
> "modification of tests and/or features and the grouping of them in order must take into account"
> "product manager as features need to deliver to end users with scopes that products must retained ability to extend with roadmaps, and maintainability"

SE-3 covers individual skill creation (brainstorm, requirements, cross-cutting-change) but does NOT cover:
- Features **designed** as an interdependent ecosystem
- Production deployment readiness verification
- Product roadmap maintainability over time

## Scope (WHAT — locked)

| Skill | Purpose | Routes To |
|-------|---------|-----------|
| hm-feature-ecosystem | Cross-dependency design: impact analysis across features, dependency graph validation, grouping features for ordered delivery. Detects circular dependencies, missing interfaces, orphan features. | hm-spec-driven-authoring, hm-test-driven-execution |
| hm-production-readiness | Deployment verification: changelog completeness, migration script validation, rollback plan, monitoring setup, evidence collection for gate-evidence-truth. Bridges implementation → deployment. | hm-gate-orchestrator (via gate-evidence-truth) |
| hm-roadmap-maintainability | Product roadmap: feature ordering by dependency, maintainability scoring (complexity, coupling, test coverage), extensibility checks. Long-term product health. | hm-brainstorm, hm-requirements-analysis |

## Design Constraints
- All 3 must pass RICH-1 through RICH-8
- hm-* prefix: cross-lineage shipped skills
- Language-agnostic
- Must route through hm-gate-orchestrator → triad gates
- Must use skill-creator + skill-judge for quality verification

## How These Differ from SE-3 Skills

| SE-3 Skill | Handles | SE-3.5 Skill | Handles |
|-----------|---------|-------------|---------|
| hm-brainstorm | Single idea → requirements | hm-roadmap-maintainability | Multiple features over time |
| hm-cross-cutting-change | Modifying code across pans | hm-feature-ecosystem | Designing features as interdependent system |
| (none) | — | hm-production-readiness | Deployment verification end-to-end |

## NOT in Scope
- Modifying existing hm-* skills (they're consumed as-is)
- Gate skill improvements (SE-5.5)
- Agent definitions (agent-synthesis workstream)
