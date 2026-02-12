# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-02-12)

**Core value:** We create a hivemind's brain that boosts intelligence and provides users' true expertise of AI agents - work faster, more efficiently, handle with full bulletproof of context drift.
**Current focus:** Phase 2: Auto-Hooks & Governance Mesh

## Current Position

Phase 2 of 6 | Plan 2 of 4 complete | Status: Phase 2 In Progress

Progress: ██████████░░░░░░░░░░ 50% (Phase 2 in progress)

## Phase Summary

| # | Phase | Mesh System | Reqs | Status |
|---|-------|-------------|------|--------|
| 1 | SDK Foundation + System Core | Materialization Layer | SDK-01-SDK-05 | Complete |
| 2 | Auto-Hooks & Governance Mesh | Triggers & Rules | GOV-01-GOV-08 | In progress |
| 3 | Session Management & Auto-Export | Lifecycle | SES-01-SES-06 | Not started |
| 4 | Unique Agent Tools | Hook-Activated Utilities | TUL-01-TUL-07 | Not started |
| 5 | The Mems Brain Enhanced | Shared Knowledge Repository | MEM-01-MEM-06 | Not started |
| 6 | Stress Test & Integration | Mesh Validation | STR-01-STR-05 | Not started |

## Performance Metrics

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 01 | 01 | 3min | 2 | 3 |
| 01 | 02 | 15min | 3 | 6 |
| 02 | 01 | 4 min | 2 | 5 |
| 02 | 02 | 4 min | 2 | 6 |

## Accumulated Context

### Decisions

1. **5-system cognitive mesh, not feature list** - interconnected systems that chain automatically (hook -> session -> tool -> mem -> core)
2. **SDK = materialization, not foundation** - core concepts in `src/lib/` are platform-portable, only `src/hooks/` touches SDK
3. **NEVER block/deny tools** - soft governance only, will not clash with other plugins
4. **Phase ordering IS the dependency chain** - each phase adds one mesh system that depends on previous systems being functional
5. **Repomix wrapped, not reimplemented** - use BunShell `$` to spawn `npx repomix` under the hood
6. **Ralph loop is manual-pattern** - implement loop state machine directly, no ralph-tui binary dependency
7. **No `client.*` during init** - deadlock risk (oh-my-opencode issue #1301), only use from hooks/tools
8. **Used module-level singleton pattern for SDK context** - avoid circular dependencies and deadlock risks during plugin init
9. **Extracted BunShell type from `PluginInput['$']`** - avoid importing from dist internals
10. **Added 5th hook (event) for real event-driven governance** - replacing turn-counting hacks in Phase 2
11. **Enforced strict architecture boundary: `src/lib/` never imports `@opencode-ai`** - keep core concepts platform-portable
12. **Wired boundary check into npm test to prevent regressions** - catch violations early in CI
13. **Lock severity mapping in `src/lib/detection.ts` as shared governance source of truth**
14. **Use `turn_count <= 2` bootstrap gate across strict, assisted, and permissive modes**
15. **Suppress detection-pressure warnings in permissive mode while keeping navigation context**
16. **Use `governance_counters` as single escalation source for toast severity progression**
17. **Record toast cooldown only after successful SDK dispatch to preserve first visible signal**
18. **Route compaction feedback through shared adapter but keep variant fixed to `info`**

### Pending

- Execute `02-03-PLAN.md` in Phase 2.

### Research Outcome: SDK-RESEARCH-01

**Finding:** Custom TUI panels are not supported by OpenCode SDK.
**Decision:** Defer embedded dashboard to v2. Proceed with original Phase 1 scope.
**Impact:** `showToast()` remains available for Phase 2 governance visual feedback.

### Blockers

(None)

## Session Continuity

Last session: 2026-02-12
Stopped at: Completed 02-02-PLAN.md
Resume: /gsd-execute-phase 02-auto-hooks-governance-mesh
