---
workstream: skill-ecosystem
created: 2026-04-27
updated: 2026-04-30
phase_count: 17
---

# Workstream State: Skill Ecosystem Gap Closure

## Current Position
**Status:** SE-11 COMPLETE — Naming Syndicate Formalization
**Current Phase:** SE-11 (Naming Syndicate Formalization) — COMPLETE
**Last Activity:** 2026-04-30 (SE-11 complete — hf-l2-naming-syndicate skill with glob patterns, RICH-8 8/8, D1-D8 108/120 A)

## Progress
| Phase | Status | Plans | Summary |
|-------|--------|-------|---------|
| SE-1 | ✅ COMPLETE | 1/1 | 10 renames, 1 removal, cross-ref fixes, agent permissions, AGENTS.md update, code review fixes |
| SE-2 | ✅ COMPLETE | 4/4 | Planning pipeline backbone: hm-planning-persistence SKILL.md, 20+ reference fixes across 12 skills, D-04 soft boundary, disabled skill archived |
| SE-3 | ✅ COMPLETE | 1/1 | 4 pre-gate skills hardened to RICH-8 ≥6/8: evals (3 scenarios each), self-correction (4 modes), metrics scorecards (D1-D8: A-grade), framework-agnostic paths |
| SE-3.5 | ✅ COMPLETE | 1/1 | Harden existing Feature ecosystem skills: hm-feature-ecosystem, hm-production-readiness, hm-roadmap-maintainability — all ≥6/8 RICH-8 |
| SE-3.6 | ✅ COMPLETE | 1/1 | Harden hm-product-validation: Self-Correction (4 modes), metrics scorecard, evals (3 scenarios), 8/8 RICH-8, no hardcoded paths |
| SE-4 | ✅ COMPLETE | 1/1 | 5 research chain skills hardened to RICH-8 ≥8/8: hm-tech-stack-ingest (new metrics/evals + self-correction), hm-detective (self-correction + 8/8), hm-deep-research (self-correction + 8/8), hm-synthesis (self-correction + 8/8), hm-research-chain (Stage 0 added, self-correction + 8/8). Bidirectional cross-references fixed across all 5 skills. |
| SE-5 | ✅ COMPLETE | 1/1 | Gate orchestration + lineage routing: hm-gate-orchestrator (8/8 RICH-8) + hm-lineage-router (8/8 RICH-8). 3 dead refs resolved. AS-3 UNBLOCKED. |
| SE-5.5 | ✅ COMPLETE | 1/1 | Internal gate skills hardening: 3 gate-* skills hardened (self-correction 4 modes each, hm-gate-orchestrator integration, metrics/evals on disk, all 8/8 RICH-8) |
| SE-6 | ✅ COMPLETE | 1/1 | Context validation sweep: 29 CONTEXT.md files verified, 13 stale statuses fixed, 3 stale claims corrected, hf-meta-builder naming RESOLVED confirmed, AS-3 unblock noted in agent-synthesis STATE.md |
| SE-7 | ✅ COMPLETE | 1/1 | Reference integrity audit: 51 SKILL.md scanned, 70 unique refs verified, 4 dead refs fixed (hm-meta-builder×2, hm-code-review, hm-uat-verify), 0 context poisoning, 0 dead refs remaining |
| SE-8 | ✅ COMPLETE | 1/1 | 31 orphan skills hardened: 25 hm-*/hf-* skills to RICH-8 ≥6/8 (24 at ≥6, 1 at 5/8 documented), 6 stack-* reference skills with applicable scoring. 54 files created/modified. |
| SE-9 | ✅ COMPLETE | 1/1 | AGENTS.md synced (97 agents, 51 skills, 18 commands), cross-ref integrity confirmed (0 dead refs), disabled skill verified archived, 0 regressions (no context poisoning, SE-2/SE-4 refs intact), symlink path corrected |
| SE-10 | PLANNED | 0 | Skill routing & agent dispatch bindings: hm-skill-router + hf-skill-router creation |
| SE-11 | ✅ COMPLETE | 1/1 | Naming syndicate skill: hf-l2-naming-syndicate created, formal naming rules for all 5 lineages documented, glob pattern reference, 16 eval scenarios, RICH-8 8/8, D1-D8 108/120 (A) |
| SE-12 | PLANNED | 0 | Tool capability matrix (skill side): TOOL-CAPABILITY-MATRIX.md + 49 skill declarations |
| SE-13 | PLANNED | 0 | Hivemind engine contracts: hm-hivemind-state-reference + hf-hivemind-state-reference |
| SE-14 | PLANNED | 0 | Skill-agent integration contracts: INTEGRATION-CONTRACTS.md + bidirectional bindings |

**Phases Complete:** 12/17
**Phases Authorized:** 13/17 (SE-1 ✅, SE-2 ✅, SE-3 ✅, SE-3.5 ✅, SE-3.6 ✅, SE-4 ✅, SE-5 ✅, SE-5.5 ✅, SE-6 ✅, SE-7 ✅, SE-8 ✅, SE-9 ✅, SE-11 ✅)

## Skills Inventory (2026-04-29 Verified)

**Active skills on disk: 51** (all have SKILL.md) — **ALL RENAMED** 2026-04-30 to `{lineage}-{depth}-{name}` format.

| Lineage | Count | Old Prefix | New Prefix | Scope |
|---------|-------|------------|------------|-------|
| Product dev L2 | 20 | `hm-*` | `hm-l2-*` | Shipped — planning, research, execution, quality, gate orchestration, lineage routing |
| Product dev L3 | 10 | `hm-*` | `hm-l3-*` | Shipped — detective, deep research, synthesis, research chain, tech stack, platform reference |
| Meta-builder L2 | 13 | `hf-*` | `hf-l2-*` | Shipped — skill/agent/command/tool authoring |
| Internal gates L3 | 3 | `gate-*` | `gate-l3-*` | THIS PROJECT ONLY — evidence-truth, lifecycle-integration, spec-compliance |
| Stack reference L3 | 6 | `stack-*` | `stack-l3-*` | Shipped — bun-pty, json-render, nextjs, opencode, vitest, zod |
| Unprefixed | 1 | `opencode-config-workflow` | `opencode-config-workflow` | Shipped — framework-agnostic config workflow (unchanged) |

**Total: 52 skill directories (51 active + 1 disabled); all renamed to depth-qualified names.**

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
SE-9     → SE-7 + SE-8 ✅
SE-10    → SE-9 (routing needs all skills stable) (→ Blocks AS-3, AS-7)
SE-11    → SE-9 (naming syndicate needs all skills stable) [✅ COMPLETE] (→ Blocks AS-11)
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
                                  ├──→ SE-5 ✅ ──→ SE-5.5 ──→ SE-6 ──→ SE-7 ──→ SE-9 ✅ ──┬──→ SE-10 ──→ SE-11 ──┐
                                                                                        │                          │
                                                                                        └──→ SE-12 ──→ SE-13 ──┴──→ SE-14
```

## Architecture Decisions (Locked)
- **D-01:** `.hivemind/` native — planning artifacts persist to `.hivemind/state/planning/` per Q6
- **D-02:** Internal (gate-*) vs shipped (hm-*) differentiation — gate-* skills are THIS PROJECT ONLY
- **D-03:** All planning pipeline skills use hm-* prefix (shipped product)
- **D-04:** Coordinating-loop uses soft boundary (no hard prerequisite check)

## Session Continuity
**Stopped At:** SE-11 COMPLETE — Naming Syndicate Formalization
**Resume:** Move to SE-10 (Skill routing & agent dispatch bindings) or SE-12 (Tool capability matrix)
**Git Commits:** cc27fde7 (SE-11 main), f9adcae9 (self-check)
**Handoff:** `.planning/workstreams/skill-ecosystem/phases/SE-11-naming-syndicate-formalization/SE-11-SUMMARY.md`

## Known Issues (2026-04-30 — post SE-9 audit)

1. ~~**AGENTS.md skill count stale**~~ — RESOLVED 2026-04-30 (SE-9): Updated to 51 active skills, 97 agents, 18 commands, 30 hm-* skills. Symlink path corrected (.hivefiver-hm-meta-builder → .hivefiver-meta-builder).
2. ~~hm-gate-orchestrator does not exist~~ — RESOLVED 2026-04-29: Created in SE-5 with 8/8 RICH-8. Dead refs in hm-production-readiness, hm-requirements-analysis, hm-roadmap-maintainability resolved.
3. ~~hm-lineage-router does not exist~~ — RESOLVED 2026-04-29: Created in SE-5 with 8/8 RICH-8. 6 category bundles with max-5-skill enforcement.
4. ~~SE-2 partially executed~~ — RESOLVED 2026-04-29: All 4 plans executed, 20+ reference fixes applied, disabled skill archived
5. ~~**hf-meta-builder name mismatch**~~ — RESOLVED 2026-04-29: frontmatter now correctly says `name: hf-meta-builder` (was `hr-meta-builder`)
6. ~~Disabled hm-planning-with-files still referenced by 9 active skills~~ — RESOLVED 2026-04-29: All 12 skills fixed, disabled skill archived to .opencode/retired/
7. ~~25 orphan skills not covered by any forward SE phase~~ — RESOLVED 2026-04-29: All 31 skills hardened in SE-8 (15 hm-* + 10 hf-* + 6 stack-*), 24/25 workflow skills ≥6/8 RICH-8
8. ~~**No terminal verification** of full ecosystem coherence~~ — RESOLVED 2026-04-30 (SE-9): AGENTS.md synced, cross-ref integrity confirmed (0 dead skill refs), no context poisoning, SE-2/SE-4 refs intact, disabled skill verified archived.
9. **hf-command-dev at 5/8 RICH-8** — thin 81 LOC skill, honest score documented. Future hardening may be needed.
10. **5 agent files reference hm-planning-with-files in permission allowlists** (conductor, coordinator, hivefiver, hivefiver-orchestrator, spec-verifier) — low-severity stale references, no runtime impact.
