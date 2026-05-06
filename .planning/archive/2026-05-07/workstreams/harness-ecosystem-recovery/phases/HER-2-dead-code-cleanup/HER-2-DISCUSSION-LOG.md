# Phase HER-2: Dead Code Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis.

**Date:** 2026-05-05
**Phase:** HER-2-dead-code-cleanup
**Mode:** discuss
**Areas analyzed:** auto-loop + ralph-loop fate, supervisor/ + recovery-engine fate, notification-handler boundary, session-entry/ wiring surface

## Discussion Summary

### Area 1: auto-loop + ralph-loop fate (328 LOC)
- **Options presented:** Wire both / Wire auto-loop only / Remove both / Remove files keep types
- **User selection:** Wire both as features
- **Research:** Both are pure DI orchestrators. auto-loop drives self-referential dev loops, ralph-loop drives validate-fix cycles. Zero consumers but clean, well-typed code.
- **Decision:** Wire both as runtime features in plugin.ts (D-01 through D-03)

### Area 2: supervisor/ + recovery-engine fate (491 LOC)
- **Options presented:** Wire supervisor/ remove facade / Remove both / Wire both / Remove facade only
- **User response:** Requested deeper investigation before deciding
- **Research findings:**
  - supervisor/health.ts → superseded by sdk-supervisor/ (wired)
  - supervisor/command-bundle.ts → superseded by command-engine/ (wired)
  - supervisor/context-renderer.ts → superseded by command-engine/renderCommandContext() (wired)
  - supervisor/messages-transform.ts → explicitly stripped in Phase 35
  - recovery-engine.ts → zero consumers, facade for already-wired recovery/ modules
- **User selection:** Remove both (after research confirmed full supersession)
- **Decision:** Remove supervisor/ and recovery-engine.ts (D-04, D-05)

### Area 3: notification-handler boundary (290 LOC)
- **Options presented:** Remove DEPRECATED tag / Remove imports / Investigate first
- **User selection:** Investigate first (with context about F-06 delegation revamp)
- **Research findings:**
  - notifyDelegationTerminal — ACTUALLY CALLED in delegation-state-machine.ts:290 (hot path)
  - replayPendingNotifications — ACTUALLY CALLED in lifecycle-manager.ts:185 (hot path)
  - Stale comment in create-core-hooks.ts:8 claims "removed (dead code)" — wrong
  - buildTaskNotificationFromContinuity — genuinely unused export
- **User selection:** Fix tags, keep module
- **Decision:** Remove DEPRECATED tag, fix stale comment, remove unused export (D-06 through D-09)

### Area 4: session-entry/ wiring surface (667 LOC)
- **Options presented:** Wire as hooks only / Wire as hooks + optional tool / Wire as hooks defer to HER-3
- **User selection:** Wire as hooks now, defer tools to later phases following CUSTOM-TOOLS-CRITERIA
- **Research findings:**
  - All 4 modules are pure functions (no side effects)
  - system.transform stub at create-core-hooks.ts:68-74 was left empty waiting for this
  - F-04c (workflow router) requires this for intent→domain→skill→agent routing
  - Risk: type drift — code written for different architecture era
- **Decision:** Wire as hooks, defer tools (D-10 through D-15)

### HER-0 Pre-Decided (no discussion needed)
- work-contract/ (613 LOC) → Remove (D-16)
- runtime-detection/ partial orphans (407 LOC) → Remove dead files, keep stack-synthesizer.ts (D-17 through D-19)

## Deferred Ideas
- session-entry/ tool wrappers — later phases, must follow CUSTOM-TOOLS-CRITERIA
- F-06 delegation revamp — notification-handler is part of larger effort
- supervisor/ health checks — revisit after HER-3 if observability gaps emerge

## Canonical Refs Added
- `.planning/CUSTOM-TOOLS-CRITERIA-2026-05-05.md` — referenced by user for deferred tool design
