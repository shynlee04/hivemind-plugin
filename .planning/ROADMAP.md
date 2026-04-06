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

8 sub-phases (priority-ordered):
- 2a. Background Agents — spawn in new panes, auto-cleanup
- 2b. Delegation Chain — task persistence, parent-child tracking
- 2c. Concurrency Control — keyed semaphore, FIFO queue (partial: `src/lib/concurrency.ts` exists)
- 2d. Session Recovery — context integrity across session boundaries
- 2e. Context Governance — cross-session rule enforcement
- 2f. Injection Engine — conditional runtime injection of rules, commands, skills, tools
- 2g. Specialist Classification — configurable agent presets, category routing
- 2h. Circuit Breaker — per-session tool call limits (partial: `CIRCUIT_BREAKER_THRESHOLD=16` exists)

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
