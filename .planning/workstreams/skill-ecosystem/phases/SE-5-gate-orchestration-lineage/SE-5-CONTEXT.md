# Phase SE-5: Gate Orchestration & Lineage Routing — CONTEXT

**Workstream:** skill-ecosystem
**Phase:** SE-5
**Depends on:** SE-3 + SE-4 (pre-gate and research skills must exist)
**Status:** DRAFT — awaiting discuss-phase authorization

## Authorized Decision
Create unified entry point for quality gate triad and lineage classification routing. Gates are currently invoked independently with no routing between hm-* and hf-* lineages.

## Scope (WHAT — locked)

| Skill | Purpose |
|-------|---------|
| hm-gate-orchestrator | Single entry for triad: lifecycle → spec → evidence. Unified PASS/FAIL/REMEDIATE verdict. Routes to hm-coordinating-loop on FAIL. |
| hm-lineage-router | Classifies task intent (product dev vs meta builder). Routes to correct hm-* or hf-* skill chain. |

### Integration Requirements
- Wire into hm-meta-builder routing tables
- All shipped hm-* and hf-* skills must declare lineage in YAML frontmatter
- SE-3 and SE-4 skills must route through hm-gate-orchestrator

## Constraints
- hm-* prefix: shared/cross-over skills
- The 3 gate skills (gate-*) remain INTERNAL-USE — not modified, only routed through
- Must use skill-creator + skill-judge for quality verification

## NOT in Scope
- Modifying gate skill bodies (INTERNAL-USE)
- Creating new gate logic
