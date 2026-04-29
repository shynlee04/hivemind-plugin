---
workstream: skill-ecosystem
created: 2026-04-27
updated: 2026-04-29
phase_count: 17
---

# Workstream State: Skill Ecosystem Gap Closure

## Current Position
**Status:** SE-2 PARTIALLY COMPLETE (hm-planning-persistence exists, 4 plans not executed, 11 references unverified)
**Current Phase:** SE-2 (Planning Pipeline Backbone)
**Last Activity:** 2026-04-29 (comprehensive audit — skill count, lineage, dependency chain verified)

## Progress
| Phase | Status | Plans | Summary |
|-------|--------|-------|---------|
| SE-1 | ✅ COMPLETE | 1/1 | 10 renames, 1 removal, cross-ref fixes, agent permissions, AGENTS.md update, code review fixes |
| SE-2 | ⚠️ PARTIAL | 4 | Planning pipeline backbone: hm-planning-persistence SKILL.md created, 4 plans drafted but not executed, 11 reference fixes unverified |
| SE-3 | PLANNED (needs refresh) | 0 | Harden existing Pre-Gate skills (15-20KB on disk): hm-brainstorm, hm-requirements-analysis, hm-cross-cutting-change, hm-tech-context-compliance |
| SE-3.5 | PLANNED | 0 | Harden existing Feature ecosystem skills (on disk): hm-feature-ecosystem, hm-production-readiness, hm-roadmap-maintainability |
| SE-3.6 | PLANNED | 0 | Harden existing hm-product-validation (20KB on disk): RICH audit, trigger tuning, quality gate alignment |
| SE-4 | PLANNED (needs refresh) | 0 | Harden existing hm-tech-stack-ingest + research chain bidirectional fixes |
| SE-5 | PLANNED | 0 | Gate orchestration + lineage routing (hm-gate-orchestrator + hm-lineage-router creation) |
| SE-5.5 | PLANNED | 0 | Internal gate skills hardening (gate-* — THIS PROJECT ONLY) |
| SE-6 | PLANNED | 0 | Meta-builder: hf-config-workflow + hf-agent-synthesizer |
| SE-7 | PLANNED | 0 | Integration verification: RICH audit, cross-ref integrity, E2E workflow test |
| SE-8 | PLANNED | 0 | Orphan skill triage: 25 skills not covered by any forward SE phase |
| SE-9 | PLANNED | 0 | Final ecosystem sweep: AGENTS.md sync, cross-ref integrity, disabled skill cleanup |
| SE-10 | PLANNED | 0 | Skill routing & agent dispatch bindings: hm-skill-router + hf-skill-router creation |
| SE-11 | PLANNED | 0 | Naming syndicate formalization: NAMING-SYNDICATE.md + validation script |
| SE-12 | PLANNED | 0 | Tool capability matrix (skill side): TOOL-CAPABILITY-MATRIX.md + 49 skill declarations |
| SE-13 | PLANNED | 0 | Hivemind engine contracts: hm-hivemind-state-reference + hf-hivemind-state-reference |
| SE-14 | PLANNED | 0 | Skill-agent integration contracts: INTEGRATION-CONTRACTS.md + bidirectional bindings |

**Phases Complete:** 1/17
**Phases Authorized:** 2/17 (SE-1 ✅, SE-2 ⚠️ PARTIAL)

## Skills Inventory (2026-04-29 Verified)

**Active skills on disk: 49** (all have SKILL.md)

| Lineage | Count | Prefix | Scope |
|---------|-------|--------|-------|
| Product dev | 28 | `hm-*` | Shipped — planning, research, execution, quality |
| Meta-builder | 11 | `hf-*` | Shipped — skill/agent/command/tool authoring |
| Internal gates | 3 | `gate-*` | THIS PROJECT ONLY — evidence-truth, lifecycle-integration, spec-compliance |
| Stack reference | 6 | `stack-*` | Shipped — bun-pty, json-render, nextjs, opencode, vitest, zod |
| Unprefixed | 1 | `opencode-config-workflow` | Shipped — framework-agnostic config workflow |

**Disabled:** 1 (`donotusethis-hm-planning-with-files` — directory exists, no SKILL.md)
**Orphan skills (not in any forward SE phase):** 25 (covered by SE-8)

## Dependencies

### Dependency Chain Summary
```
SE-1  ✅ (no deps)
SE-2  ⚠️ PARTIAL (no deps)
SE-3     → SE-2 (for planning-persistence fix)
SE-3.5   → SE-2 (for planning-persistence fix)
SE-3.6   → SE-3 (hm-product-validation hardening needs pre-gate skills complete)
SE-4     → SE-2 (for research chain references)
SE-5     → SE-3 + SE-4 (gate-orchestration needs both pre-gate skills and research pipeline)
SE-5.5   → SE-5 (needs gate-orchestrator)
SE-6     → SE-5 (needs lineage-router)
SE-7     → SE-5 + SE-6
SE-8     → SE-2
SE-9     → SE-7 + SE-8
SE-10    → SE-9 (routing needs all skills stable)
SE-11    → SE-10 (naming syndicate needs routers)
SE-12    → SE-9 (tool matrix needs all skills hardened)
SE-13    → SE-12 (engine contracts need tool matrix)
SE-14    → SE-13 + SE-11 (integration contracts need engine contracts + stable naming)
```

### Parallelization Opportunities
- SE-3, SE-3.5, SE-4, SE-8 can run in parallel after SE-2 completes; SE-3.6 runs after SE-3
- SE-5.5 depends on SE-5; SE-6 depends on SE-5
- SE-7 is the integration convergence point (needs SE-5 + SE-6)
- SE-9 is the final sweep (needs SE-7 + SE-8)
- SE-10 depends on SE-9 (all skills must be stable before routing is built)
- SE-11 depends on SE-10 (naming syndicate needs stable routers)
- SE-12 can run in parallel with SE-10 (both depend on SE-9)
- SE-13 depends on SE-12 (engine contracts need tool matrix awareness)
- SE-14 depends on SE-13 + SE-11 (convergence of engine contracts + naming syndicate)

### Visual Flow
```
SE-1 ✅ ──→ SE-2 ⚠️ ──→ SE-3 ──┐
                       SE-3.5 ──┤
                       SE-3.6 ──┤
                            SE-4 ─┤
                            SE-8 ─┤
                                  ├──→ SE-5 ──→ SE-5.5 ──→ SE-6 ──→ SE-7 ──→ SE-9 ──┬──→ SE-10 ──→ SE-11 ──┐
                                                                                        │                          │
                                                                                        └──→ SE-12 ──→ SE-13 ──┴──→ SE-14
```

## Architecture Decisions (Locked)
- **D-01:** `.hivemind/` native — planning artifacts persist to `.hivemind/state/planning/` per Q6
- **D-02:** Internal (gate-*) vs shipped (hm-*) differentiation — gate-* skills are THIS PROJECT ONLY
- **D-03:** All planning pipeline skills use hm-* prefix (shipped product)
- **D-04:** Coordinating-loop uses soft boundary (no hard prerequisite check)

## Session Continuity
**Stopped At:** SE-2 PARTIALLY COMPLETE — hm-planning-persistence SKILL.md created, 4 PLAN.md files drafted but not executed
**Resume:** Execute SE-2 remaining plans (01-research+create, 02-critical+fixes, 03-remaining+meta, 04-archive+verify) → verify 11 reference fixes → move to SE-3
**Git Commits:** e114cdb8, f0c785db, 01f1ccd1 (SE-1), 2f8111e8 (SE-1 review fixes)
**Handoff:** `.planning/workstreams/skill-ecosystem/CONTINUE-2026-04-28.md`

## Known Issues (2026-04-29 Audit)

1. **AGENTS.md skill count stale** — claims 33 skills, reality is 49 active + 1 disabled (18 skills behind)
2. **hm-gate-orchestrator does not exist** — referenced by 3 skills (hm-production-readiness, hm-requirements-analysis, hm-roadmap-maintainability) but no SKILL.md (SE-5 deliverable)
3. **hm-lineage-router does not exist** — needed for skill lineage routing (SE-5 deliverable)
4. **SE-2 partially executed** — hm-planning-persistence SKILL.md created but 4 plans not executed, 11 reference fixes unverified
5. **hf-meta-builder name mismatch** — directory is `hf-meta-builder` but frontmatter says `name: hr-meta-builder` (wrong `hr-` prefix instead of `hf-`)
6. **Disabled hm-planning-with-files** still referenced by 9 active skills
7. **25 orphan skills** not covered by any forward SE phase — triaged to SE-8
