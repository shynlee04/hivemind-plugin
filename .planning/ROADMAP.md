# Roadmap: Harness Cleanup → V3 Runtime

**Created:** 2026-04-06
**Updated:** 2026-04-08 (Phase 2 runtime architecture complete through 02-09)
**Granularity:** Fine

## Phases Overview

- [x] **Phase 1: Baseline Cleanup** — 7/10 done, 3 pending (planned)
- [x] **Phase 2: V3 Runtime Architecture** — 9/9 plans complete
- [ ] **Phase 3: Schema Definition** — 0/4
- [ ] **Phase 4: Migration Gate** — 0/4
- [ ] **Phase 5: Integration Verification** — 0/5

## Phase 1: Baseline Cleanup

### Already Done ✅ (verified against source)

1. ✅ Double-compaction avoided — `src/plugins/prompt-enhance.ts` records compaction in event hook, single increment
2. ✅ Heading regex anchored — `src/tools/session-patch/tools.ts` uses `match[1]` exact match
3. ✅ Cross-line contradiction detection — `src/tools/prompt-analyze/tools.ts` nested loop comparison
4. ✅ System-transform gating — `src/hooks/system-transform.ts` checks delegation metadata
5. ✅ `recommended_lanes` removed — `src/tools/prompt-skim/tools.ts` output has no such field
6. ✅ `.opencode/tools/*.ts` deleted — only `.gitkeep` remains
7. ✅ Test files canonical form — `tests/tools/*.test.ts` all import from `src/tools/`

### Still Pending 🔄

8. 🔄 Remove `system.transform` wiring from `src/plugin.ts` (lines 38-39 import, lines 315-320 wiring)
9. 🔄 Fix `hivefiver-orchestrator.md` expecting `recommended_lanes` (lines 102, 163)
10. 🔄 Replace heuristic context-budget with real OpenCode compaction data

### Plans
**Plans:** 1 plan

Plans:
- [x] 01-01-PLAN.md — Execute 3 remaining cleanup items (remove system.transform wiring, fix orchestrator phantoms, remove context-budget tool)

## Phase 2: V3 Runtime Architecture

Executable recovery plan set replacing the stale reference-only Phase 02 plans. These plans are grounded in current V3 runtime code reality and preserve the still-locked Phase 02 decisions.

Recovery plan structure:
- 2c/2h. Runtime policy foundation — configurable concurrency + budgets that supplement OpenCode built-ins
- 2a. Hybrid background execution — full D-12/D-13 auto-detect across execution family and built-in submodes
- 2b/2g. Delegation lineage + advisory specialist routing — continuity canonical, exports optional
- 2d. Session recovery — staleness check, risk framing, CQRS-safe checkpoint/resume
- 2e. Context governance — soft-policy rules with runtime mutation and violation logging
- 2f. Injection engine — conditional session-start and compaction-time injection with governance filtering

**Plans:** 9 plans

Plans:
- [x] 02-01-PLAN.md — Runtime policy foundation: configurable concurrency and budgets that explicitly supplement OpenCode built-ins (Wave 1)
- [x] 02-02-PLAN.md — Hybrid background execution: D-12/D-13 auto-detect plus hardened owned-process fallback (Wave 2)
- [x] 02-03-PLAN.md — Delegation lineage and specialist routing: continuity-first persistence with optional packet/manifest exports (Wave 3)
- [x] 02-04-PLAN.md — Session recovery and hook repair: staleness/risk framing, CQRS-safe compaction, compact/reset restoration (Wave 4)
- [x] 02-05-PLAN.md — Context governance: durable soft-policy rules, runtime mutation, violation logging (Wave 5)
- [x] 02-06-PLAN.md — Injection engine: conditional session-start and compaction-time injection with governance filtering (Wave 6)
- [x] 02-07-PLAN.md — Runtime-policy production wiring: live queue and hook budget resolution from trusted policy state (Wave 7)
- [x] 02-08-PLAN.md — Execution-mode wiring: classifier-driven live delegation runtime with owned-process background execution (Wave 8)
- [x] 02-09-PLAN.md — Injection and governance correctness: route-aware payloads, active-rule suppression, and overlapping metadata correlation (Wave 8)

## Phase 3: Schema Definition

- 3a. YAML schema for Agent frontmatter
- 3b. YAML schema for Command frontmatter
- 3c. YAML schema for Skill frontmatter
- 3d. TypeScript types + event emitters from schemas

## Phase 4: Migration Gate

- 4a. Inventory product-detox (excluding .env, tool config pollution)
- 4b. Match against proven harness-experiment baseline
- 4c. Selective migration list with user approval
- 4d. Item-by-item migration with validation

## Phase 5: Integration Verification

- 5a. Full test suite green
- 5b. Plugin loads and wires all tools + hooks
- 5c. Background agents spawn, report, clean up
- 5d. Delegation chains persist across sessions
- 5e. Injection engine applies rules conditionally
- 5f. Specialist routing correct
- 5g. Schema validation catches malformed definitions

## Progress Table

| Phase | Items Complete | Status |
|-------|---------------|--------|
| 1. Baseline Cleanup | 7/10 | Plan created (1 plan, Wave 1) |
| 2. V3 Runtime Architecture | 9/9 plans | Complete |
| 3. Schema Definition | 0/4 | Not started |
| 4. Migration Gate | 0/4 | Not started |
| 5. Integration Verification | 0/5 | Not started |

## Dependencies

```
Phase 1 (7 done, 3 pending — planned)
  └─→ Phase 2: V3 Runtime (8 sub-phases, priority-ordered)
       └─→ Phase 3: Schema Definition
            └─→ Phase 4: Migration Gate
                 └─→ Phase 5: Integration Verification
```
