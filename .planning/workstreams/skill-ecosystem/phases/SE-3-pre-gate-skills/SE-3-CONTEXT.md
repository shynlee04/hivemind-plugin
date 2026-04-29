# Phase SE-3: Pre-Gate Skills — Brainstorming, Requirements, Cross-Cutting — CONTEXT

**Workstream:** skill-ecosystem
**Phase:** SE-3
**Depends on:** SE-2 (artifact hierarchy for planning artifacts)
**Status:** DRAFT — awaiting discuss-phase authorization

## Authorized Decision
Create 4 new hm-* skills to fill the workflow gap BEFORE quality gates engage. Currently no hm-* skills cover ideation, requirements surfacing, or cross-pane change governance.

## Scope (WHAT — locked)

| Skill | Purpose | Routes To |
|-------|---------|-----------|
| hm-brainstorm | Ideation → context gathering → requirements surfacing → handoff | hm-spec-driven-authoring |
| hm-requirements-analysis | Formal requirements diagnosis, constraint discovery | hm-spec-driven-authoring |
| hm-cross-cutting-change | Cross-pane modification governance, red-first verification, lifecycle impact checking | hm-test-driven-execution |
| hm-tech-context-compliance | Tech stack validation against project constraints | hm-brainstorm, hm-spec-driven-authoring |

## Design Constraints
- All 4 must pass RICH-1 through RICH-8 (third-party synthesis, transform-improve-adopt, bundled resources, independence audit)
- Language-agnostic — no assumptions about specific stacks
- Must route output through hm-gate-orchestrator → triad gates (SE-5 integration)
- hm-* prefix: these are shared/cross-over skills per the playbook lineage model
- Must use skill-creator + skill-judge for quality verification

## NOT in Scope
- Gate orchestration (SE-5)
- Research pipeline skills (SE-4)
