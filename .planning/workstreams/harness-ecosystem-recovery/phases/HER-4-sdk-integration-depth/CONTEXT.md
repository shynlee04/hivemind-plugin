# CONTEXT: HER-4 — SDK Integration Depth

**Workstream:** harness-ecosystem-recovery
**Phase:** HER-4
**Status:** READY
**Parent:** → `workstreams/harness-ecosystem-recovery/ROADMAP.md`

## Purpose

Expand OpenCode SDK integration: handle unhandled event types, implement hook write-safety, test L2→L3 delegation depth. The HER-0 audit found 32 of 34 SDK API surfaces verified (2 stubs, 0 DRIFT). HER-4 deepens integration into the remaining surfaces and hardens the hook pipeline against mutation errors.

## Dependencies

- **HER-1 (COMPLETE ✅)**: Documentation baseline confirmed all SDK references. ARCHITECTURE.md synced to 16 tools. validate-restart 0 errors.
- **HER-0 (COMPLETE ✅)**: Lane D verified 34 SDK API surfaces (32 VERIFIED, 2 stubs).

## Feature Refs

- f-10 — SDK/server API injection & hook steering
- f-06 — Delegation with multi-lane support (delegation-revamp WS-5, DEFERRED)
- f-06.lanes — Delegation lane routing per task characteristics

## Key Modules

| Module | Path | State |
|--------|------|-------|
| session-api.ts | `src/lib/session-api.ts` | Typed SDK wrappers (baseline) |
| plugin-event-observers.ts | `src/hooks/plugin-event-observers.ts` | Event subscriptions |
| messages-transform.ts | `src/hooks/messages-transform.ts` | System.transform hook |
| create-tool-guard-hooks.ts | `src/hooks/create-tool-guard-hooks.ts` | Pre/post tool-use |
| delegation-manager.ts | `src/lib/delegation-manager.ts` | Core orchestrator |
| completion-detector.ts | `src/lib/completion-detector.ts` | Two-signal detection |

## Requirements

- Handle unhandled event types discovered in HER-0 Lane D audit (2 stubs)
- Implement hook write-safety: prevent mutation from hook pipelines leaking into canonical state
- Test L2→L3 delegation depth (depth enforcement in delegation-manager.ts)
- Expand SDK injection to cover all detected event surface gaps
- Verify hook steering behavior against OpenCode SDK v1.14.28 contracts

## Blocks

- **delegation-revamp (WS-5, DEFERRED)**: HER-4's L2→L3 depth testing provides foundation for multi-lane delegation

## Status: READY

Independent of HER-2 and HER-3 — depends only on HER-1 (COMPLETE). Can begin immediately when resourced.
