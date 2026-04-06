# Roadmap: Harness Cleanup → V3 Runtime

**Created:** 2026-04-06
**Updated:** 2026-04-06 (re-baselined — 7/18 items verified complete; Phase 1 plan created)
**Granularity:** Fine

## Phases Overview

- [x] **Phase 1: Baseline Cleanup** — 7/10 done, 3 pending (planned)
- [ ] **Phase 2: V3 Runtime Architecture** — 0/8 (new)
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

8 sub-phases (dependency-ordered: 2c→2h→2a→2b→2d→2e→2f→2g):
- 2c. Concurrency Control — keyed semaphore, FIFO queue, timeout, per-key config (partial: `src/lib/concurrency.ts` exists)
- 2h. Circuit Breaker — configurable per-session budgets, reset on compact (partial: `CIRCUIT_BREAKER_THRESHOLD=16` exists)
- 2a. Background Agents — spawn in new panes (builtin-subsession), auto-cleanup
- 2b. Delegation Chain — task persistence, parent-child tracking, manifest.json
- 2d. Session Recovery — staleness check, risk assessment, checkpoint restoration
- 2e. Context Governance — soft policy rules, runtime add/remove, violation logging
- 2f. Injection Engine — conditional injection of rules/commands/skills/tools
- 2g. Specialist Classification — agent presets, category routing, generalist fallback

**Plans:** 8 plans

Plans:
- [ ] 02-01-PLAN.md — Concurrency Control (2c): timeout + per-key limits + config loader (Wave 1)
- [ ] 02-02-PLAN.md — Circuit Breaker (2h): configurable budgets + reset on compact (Wave 1)
- [ ] 02-03-PLAN.md — Background Agents (2a): BackgroundAgentRunner + delegate-task integration (Wave 2)
- [ ] 02-04-PLAN.md — Delegation Chain (2b): packet CRUD + manifest + continuity wiring (Wave 2)
- [ ] 02-05-PLAN.md — Session Recovery (2d): staleness check + risk assessment + recovery (Wave 3)
- [ ] 02-06-PLAN.md — Specialist Classification (2g): agent presets + specialist router (Wave 3)
- [ ] 02-07-PLAN.md — Context Governance (2e): rule engine + runtime management + violations (Wave 4)
- [ ] 02-08-PLAN.md — Injection Engine (2f): conditional injection + governance filtering (Wave 5)

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
| 2. V3 Runtime Architecture | 0/8 | Not started |
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
