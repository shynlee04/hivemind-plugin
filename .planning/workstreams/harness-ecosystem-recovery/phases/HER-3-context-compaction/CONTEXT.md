# CONTEXT: HER-3 — Context & Compaction

**Workstream:** harness-ecosystem-recovery
**Phase:** HER-3
**Status:** READY
**Parent:** → `workstreams/harness-ecosystem-recovery/ROADMAP.md`

## Purpose

Implement context budget management using wired prompt-packet/ + re-implemented Cognitive Packer and Injection Orchestrator. Transform runtime hooks from noisy output into queryable context that agents can use for context window management, hallucination prevention, and long-haul session survival.

## Dependencies

- **HER-2 (COMPLETE ✅)**: prompt-packet/ compaction-preservation wired into compaction hook (Plan 03). Session-entry/ wired as event observer + system.transform hook. These are the prerequisite integration points HER-3 builds on.
- **HER-1 (COMPLETE ✅)**: Documentation and configuration baseline for context-related modules.

## Feature Refs

- f-08 — Event-tracker redesign: produce queryable context (currently writes but output is noise)
- f-08.ii — Time-machine replay from event journal (journal-query.ts exists, partially functional)
- f-09 — Long-haul session survival via compaction hooks (compaction-preservation wired in HER-2)

## Key Modules

| Module | Path | State |
|--------|------|-------|
| prompt-packet/ | `src/lib/` submodules | Wired (HER-2 Plan 03) |
| session-entry/ | `src/hooks/` | Wired (HER-2 Plan 03) |
| event-tracker/ | `src/lib/` submodules | Writes but output is noise |
| Cognitive Packer | `src/lib/` (to re-implement) | ⊘ Needs rebuild |
| Injection Orchestrator | `src/lib/` (to re-implement) | ⊘ Needs rebuild |
| context-budget | `src/tools/` | ⊘ Needs real data model |

## Requirements

- Re-implement Cognitive Packer to consume prompt-packet/ compaction state
- Re-implement Injection Orchestrator with route-aware context routing
- Make event-tracker output queryable (f-08) — currently writes unstructured noise
- Implement context budget management using real OpenCode compaction data (not fake 15% linear model from LOW-01)
- Wire time-machine replay from event journal (f-08.ii)

## Blocks

- **context-compaction-engine (WS-7, DEFERRED)**: HER-3 provides the compaction pipeline that WS-7's event-tracker redesign and context purification build on

## Status: READY

HER-2 dependency is satisfied — prompt-packet/ compaction-preservation wired and session-entry/ hooks are instrumented. HER-3 can begin immediately when resourced.
