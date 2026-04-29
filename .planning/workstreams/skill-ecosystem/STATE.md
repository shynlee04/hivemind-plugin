---
workstream: skill-ecosystem
created: 2026-04-27
updated: 2026-04-29
phase_count: 17
---

# Workstream State: Skill Ecosystem Gap Closure

## Current Position
**Status:** SE-4 COMPLETE — SE-3.6, SE-5 ready to begin
**Current Phase:** SE-4 (Research Pipeline Hardening) — COMPLETE
**Last Activity:** 2026-04-29 (SE-4 complete — 5 research chain skills hardened: hm-tech-stack-ingest, hm-detective, hm-deep-research, hm-synthesis, hm-research-chain; all ≥8/8 RICH-8; bidirectional cross-references fixed; Stage 0 ingest added to chain)

## Progress
| Phase | Status | Plans | Summary |
|-------|--------|-------|---------|
| SE-1 | ✅ COMPLETE | 1/1 | 10 renames, 1 removal, cross-ref fixes, agent permissions, AGENTS.md update, code review fixes |
| SE-2 | ✅ COMPLETE | 4/4 | Planning pipeline backbone: hm-planning-persistence SKILL.md, 20+ reference fixes across 12 skills, D-04 soft boundary, disabled skill archived |
| SE-3 | ✅ COMPLETE | 1/1 | 4 pre-gate skills hardened to RICH-8 ≥6/8: evals (3 scenarios each), self-correction (4 modes), metrics scorecards (D1-D8: A-grade), framework-agnostic paths |
| SE-3.5 | ✅ COMPLETE | 1/1 | Harden existing Feature ecosystem skills: hm-feature-ecosystem, hm-production-readiness, hm-roadmap-maintainability — all ≥6/8 RICH-8 |
| SE-3.6 | PLANNED | 0 | Harden existing hm-product-validation (20KB on disk): RICH audit, trigger tuning, quality gate alignment |
| SE-4 | ✅ COMPLETE | 1/1 | 5 research chain skills hardened to RICH-8 ≥8/8: hm-tech-stack-ingest (new metrics/evals + self-correction), hm-detective (self-correction + 8/8), hm-deep-research (self-correction + 8/8), hm-synthesis (self-correction + 8/8), hm-research-chain (Stage 0 added, self-correction + 8/8). Bidirectional cross-references fixed across all 5 skills. |
| SE-5 | PLANNED | 0 | Gate orchestration + lineage routing (hm-gate-orchestrator + hm-lineage-router creation) |
| SE-5.5 | PLANNED | 0 | Internal gate skills hardening (gate-* — THIS PROJECT ONLY) |
| SE-6 | PLANNED | 0 | Meta-builder: hf-config-workflow + hf-agent-synthesizer |
| SE-7 | PLANNED | 0 | Integration verification: RICH audit, cross-ref integrity, E2E workflow test |
| SE-8 | ✅ COMPLETE | 1/1 | 31 orphan skills hardened: 25 hm-*/hf-* skills to RICH-8 ≥6/8 (24 at ≥6, 1 at 5/8 documented), 6 stack-* reference skills with applicable scoring. 54 files created/modified. |
| SE-9 | PLANNED | 0 | Final ecosystem sweep: AGENTS.md sync, cross-ref integrity, disabled skill cleanup |
| SE-10 | PLANNED | 0 | Skill routing & agent dispatch bindings: hm-skill-router + hf-skill-router creation |
| SE-11 | PLANNED | 0 | Naming syndicate formalization: NAMING-SYNDICATE.md + validation script |
| SE-12 | PLANNED | 0 | Tool capability matrix (skill side): TOOL-CAPABILITY-MATRIX.md + 49 skill declarations |
| SE-13 | PLANNED | 0 | Hivemind engine contracts: hm-hivemind-state-reference + hf-hivemind-state-reference |
| SE-14 | PLANNED | 0 | Skill-agent integration contracts: INTEGRATION-CONTRACTS.md + bidirectional bindings |

**Phases Complete:** 6/17
**Phases Authorized:** 6/17 (SE-1 ✅, SE-2 ✅, SE-3 ✅, SE-3.5 ✅, SE-4 ✅, SE-8 ✅)

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
SE-5     → SE-3 + SE-4 (gate-orchestration needs both pre-gate skills and research pipeline) (→ Blocks AS-3)
SE-5.5   → SE-5 (needs gate-orchestrator) (→ Blocks AS-7)
SE-6     → SE-5 (needs lineage-router)
SE-7     → SE-5 + SE-6
SE-8     → SE-2
SE-9     → SE-7 + SE-8
SE-10    → SE-9 (routing needs all skills stable) (→ Blocks AS-3, AS-7)
SE-11    → SE-10 (naming syndicate needs routers) (→ Blocks AS-11)
SE-12    → SE-9 (tool matrix needs all skills hardened) (→ Blocks AS-9)
SE-13    → SE-12 (engine contracts need tool matrix) (→ Blocks AS-10)
SE-14    → SE-13 + SE-11 (integration contracts need engine contracts + stable naming) (→ Blocks AS-7, AS-8)
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
**Stopped At:** SE-4 COMPLETE — All 5 research chain skills hardened to RICH-8 8/8
**Resume:** Move to SE-3.6 (hm-product-validation hardening) or SE-5 (Gate orchestration + lineage routing)
**Git Commits:** 4283c78c (hm-tech-stack-ingest), 1f8b22cf (hm-detective/deep-research/synthesis), 33f65ab7 (hm-research-chain)
**Handoff:** `.planning/workstreams/skill-ecosystem/phases/SE-4-research-pipeline/SE-4-SUMMARY.md`

## Known Issues (2026-04-29 Audit)

1. **AGENTS.md skill count stale** — claims 33 skills, reality is 49 active + 1 disabled (18 skills behind)
2. **hm-gate-orchestrator does not exist** — referenced by 3 skills (hm-production-readiness, hm-requirements-analysis, hm-roadmap-maintainability) but no SKILL.md (SE-5 deliverable)
3. **hm-lineage-router does not exist** — needed for skill lineage routing (SE-5 deliverable)
4. ~~SE-2 partially executed~~ — RESOLVED 2026-04-29: All 4 plans executed, 20+ reference fixes applied, disabled skill archived
5. **hf-meta-builder name mismatch** — directory is `hf-meta-builder` but frontmatter says `name: hr-meta-builder` (wrong `hr-` prefix instead of `hf-`)
6. ~~Disabled hm-planning-with-files still referenced by 9 active skills~~ — RESOLVED 2026-04-29: All 12 skills fixed, disabled skill archived to .opencode/retired/
7. ~~25 orphan skills not covered by any forward SE phase~~ — RESOLVED 2026-04-29: All 31 skills hardened in SE-8 (15 hm-* + 10 hf-* + 6 stack-*), 24/25 workflow skills ≥6/8 RICH-8
8. **No terminal verification** of full ecosystem coherence exists yet — SE-9 will address this.
9. **hf-command-dev at 5/8 RICH-8** — thin 81 LOC skill, honest score documented. Future hardening may be needed.
