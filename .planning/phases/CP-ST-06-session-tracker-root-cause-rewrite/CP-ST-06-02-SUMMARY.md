# CP-ST-06-02 Summary: Rewrite index.ts as Thin Facade

**Commit:** `6ec18ce5`  
**Date:** 2026-05-17  
**Phase:** CP-ST-06 (Session Tracker Root Cause Rewrite)  
**Gate:** GA-4 (index.ts ≤500 LOC) — PASSED

## What Changed

| File | Before | After | Status |
|------|--------|-------|--------|
| `src/features/session-tracker/index.ts` | 944 LOC | 478 LOC | ✅ Gate passed |
| `src/features/session-tracker/tool-delegation.ts` | — | 368 LOC | New file |
| `src/features/session-tracker/project-continuity.ts` | — | 129 LOC | New file |

## Extracted Modules

### `tool-delegation.ts` (368 LOC)
- `ToolDelegation` class with DI via `ToolDelegationDeps`
- `handleToolExecuteBefore()` — proactive child session discovery + pending registry
- `pollForChildSessions()` — fire-and-forget polling loop (5 attempts, 200ms interval)
- `recordChildToolJourney()` — child session tool event to child `.json` journey array
- `recordChildTaskDelegation()` — L2 child JSON record creation with hierarchy registration
- Pure utilities exported: `pruneToolInput()`, `pruneToolOutput()`, `extractTaskID()`, `asRecord()`

### `project-continuity.ts` (129 LOC)
- `ProjectContinuityChecker` class with DI via `ProjectContinuityDeps`
- `ensureCompleteness()` — walks session-tracker dir tree, registers missing sessions in project index
- Fixes CP-ST-02 AC-08 requirement

### `index.ts` Facade (478 LOC)
- Barrel re-exports (types, SessionRecovery)
- Class fields: 17 dependency fields (all via `Parameters<typeof constructDependencies>` type inference)
- Constructor: `{ client, projectRoot }`
- Handler methods (thin wrappers):
  - `handleSessionEvent()` → delegates to `eventCapture` + `bootstrap.copyForkedChildren`
  - `handleChatMessage()` → delegates to `sessionRouter` + `childRecorder` + `messageCapture`
  - `handleToolExecuteAfter()` → delegates to `classifier` + `toolDelegation` + `toolCapture`
  - `handleToolExecuteBefore()` → delegates to `toolDelegation`
- Route methods (kept in facade):
  - `ensureChildRoute()` / `ensureAncestorRoute()` — hierarchy index hydration
- Lifecycle:
  - `initialize()` → constructs `ToolDelegation` + `ProjectContinuityChecker` after `Object.assign(this, deps)`
  - `cleanup()` → placeholder
- Orphan cleanup:
  - `cleanupOrphanedTmpFiles()` → delegates to `orphanCleanup`
  - `cleanupOrphanDirectories()` → delegates to `orphanCleanup`

## Typecheck Result

```
npm run typecheck — zero errors
```

## Commits in This Task

| Hash | Message |
|------|---------|
| `d69b1599` | CP-ST-06-02: extract classification discriminated union |
| `f821c9af` | CP-ST-06-02: extract session-router from index.ts |
| `61f18cb4` | CP-ST-06-02: extract child-recorder from index.ts |
| `167b1a13` | CP-ST-06-02: extract constructDependencies to initialization.ts |
| `6ec18ce5` | CP-ST-06-02: rewrite index.ts as thin facade — extract tool delegation and project continuity |

## Remaining Work

- CP-ST-06-03: (per plan)
- CP-ST-06-04: (per plan)
- CP-ST-06-05: (per plan)

## Pre-existing Test Status

25 failures in `tests/features/session-tracker/index.test.ts` — not caused by this task. Tests wire fields but never call `init()`, leaving `this.classifier` undefined.
