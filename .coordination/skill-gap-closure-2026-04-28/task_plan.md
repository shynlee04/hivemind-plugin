# Task Plan: Skill Gap Closure — SE-3, SE-3.5, SE-5.5

**Session:** 2026-04-28
**Workstream:** skill-ecosystem
**Orchestrator:** hivefiver (front-facing coordinator)
**Goal:** Create 7 new hm-* skills (SE-3 + SE-3.5) and harden 3 gate-* skills (SE-5.5) to fill gaps in tech-to-features coverage for harness complex development.

## Architecture Decisions (Locked)

| ID | Decision |
|----|----------|
| D-02 | gate-* skills are THIS PROJECT ONLY — not shipped |
| D-03 | All shipped planning/feature skills use hm-* prefix |
| D-05 | Internal (gate-*) vs shipped (hm-*) must be clearly differentiated |
| D-06 | Complex cross-cutting concerns broken into downstream phases |

## Phase Summary

### Wave 1: SE-3 — Pre-Gate Skills (4 skills)
- [ ] TASK-1: Create `hm-brainstorm` — ideation → context gathering → requirements surfacing → handoff to spec-driven-authoring
- [ ] TASK-2: Create `hm-requirements-analysis` — formal requirements diagnosis, constraint discovery, real-needs surfacing
- [ ] TASK-3: Create `hm-cross-cutting-change` — cross-pane modification governance, red-first verification, lifecycle impact checking
- [ ] TASK-4: Create `hm-tech-context-compliance` — tech stack validation against project constraints, compatibility checking

### Wave 2: SE-3.5 — Feature Ecosystem Skills (3 skills)
- [ ] TASK-5: Create `hm-feature-ecosystem` — cross-dependency design, impact analysis, dependency graph validation, ordered feature delivery
- [ ] TASK-6: Create `hm-production-readiness` — deployment verification, changelog/migration validation, evidence collection for gate-evidence-truth
- [ ] TASK-7: Create `hm-roadmap-maintainability` — product roadmap, feature ordering by dependency, maintainability scoring, extensibility checks

### Wave 3: SE-5.5 — Gate Skills Hardening (3 skills)
- [ ] TASK-8: Harden `gate-lifecycle-integration` — add routing to operational skills, remediation paths, gap documentation
- [ ] TASK-9: Harden `gate-spec-compliance` — add RICH-8 scorecard, fix project-local paths
- [ ] TASK-10: Harden `gate-evidence-truth` — add RICH-8 scorecard, fix project-local paths, triad backward refs

### Wave 4: Validation
- [ ] TASK-11: RICH gate audit on all 10 skills
- [ ] TASK-12: Cross-reference integrity check

## Skill Design Constraints (ALL new hm-* skills)
- RICH-1 through RICH-8 compliance
- hm-* prefix: shipped cross-lineage skills
- Language-agnostic — no assumptions about specific stacks
- Progressive disclosure: SKILL.md ≤500 lines + references/ + scripts/
- Must route output through hm-spec-driven-authoring or hm-test-driven-execution
- Description must pass 90% pick rate criteria

## Dispatch Mode
- TASK-1 → TASK-4 can run in parallel (no shared state, independent skill files)
- TASK-5 → TASK-7 can run in parallel after Wave 1
- TASK-8 → TASK-10 depend on existing gate-* files, can run parallel
- TASK-11 → TASK-12 depend on all prior tasks

## Routing
- New hm-* skills route into: hm-spec-driven-authoring, hm-test-driven-execution, hm-gate-orchestrator
- Gate-* skills route into: hm-debug, hm-refactor, hm-coordinating-loop
- All skills consumed by: hm-gate-orchestrator (SE-5)
