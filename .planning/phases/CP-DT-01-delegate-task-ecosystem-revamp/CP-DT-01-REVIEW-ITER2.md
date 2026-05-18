---
phase: CP-DT-01-delegate-task-ecosystem-revamp
reviewed: 2026-05-18T00:00:00Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - src/coordination/delegation/agent-resolver.ts
  - src/coordination/delegation/category-gates.ts
  - src/coordination/delegation/coordinator.ts
  - src/coordination/delegation/dispatcher.ts
  - src/coordination/delegation/escalation-timer.ts
  - src/coordination/delegation/lifecycle.ts
  - src/coordination/delegation/manager-runtime.ts
  - src/coordination/delegation/manager.ts
  - src/coordination/delegation/monitor.ts
  - src/coordination/delegation/notification-router.ts
  - src/coordination/delegation/retry-handler.ts
  - src/coordination/delegation/slot-manager.ts
  - src/coordination/delegation/state-machine.ts
  - src/coordination/delegation/types.ts
  - src/coordination/completion/detector.ts
  - src/coordination/spawner/spawn-request-builder.ts
  - src/coordination/sdk-delegation/handler.ts
  - src/features/auto-loop/index.ts
  - src/features/auto-loop/types.ts
  - src/features/ralph-loop/index.ts
  - src/features/ralph-loop/types.ts
  - src/hooks/observers/delegation-consumer.ts
  - src/hooks/observers/event-observers.ts
  - src/plugin.ts
  - src/shared/types.ts
  - src/tools/delegation/delegate-task.ts
  - src/tools/delegation/delegation-status.ts
  - src/tools/delegation/types.ts
findings:
  critical: 0
  warning: 3
  info: 1
  total: 4
status: issues_found
prior_findings_resolved: 8/8
---

# Phase CP-DT-01: Code Review Report — Iteration 2

**Reviewed:** 2026-05-18
**Depth:** standard
**Files Reviewed:** 25 (+ `shared/types.ts` for re-export verification)
**Status:** issues_found
**Prior Findings:** 8/8 resolved (CR-01 through CR-06, WR-01, WR-02)

## Summary

This is the second-pass code review for CP-DT-01 (Delegate-Task Ecosystem Revamp). All 8 findings from the initial review (`CP-DT-01-REVIEW.md`, fixed in commit `761046b4`) have been verified as resolved against the actual source code.

Three new warnings and one info item were identified during this pass. No critical issues were found. The codebase demonstrates solid error propagation, proper CQRS boundary compliance (coordination never performs durable writes), correct per-delegation scoping for monitors/timers/slots, and clean dual-signal completion detection.

### Prior Findings Verification

| ID | Title | Status | Evidence |
|----|-------|--------|----------|
| CR-01 | Native Task seam returns error not success | ✅ Resolved | `delegate-task.ts` now checks `isOpenCodeRuntimeAvailable()` before dispatch |
| CR-02 | Native Task failure doesn't call `failDispatch()` | ✅ Resolved | catch block in `delegate-task.ts` calls `coordinator.failDispatch()` with cleanup |
| CR-03 | Monitor state not keyed by `delegationId` | ✅ Resolved | `monitor.ts` uses `Map<string, MonitorState>`, all methods take `delegationId` param |
| CR-04 | Session hooks not wired to v2 completion | ✅ Resolved | `event-observers.ts` + `delegation-consumer.ts` + `plugin.ts` wire idle/error/deleted |
| CR-05 | Persistence overwrites completed records | ✅ Resolved | `coordinator.ts` uses `lifecycle.list()` snapshot |
| CR-06 | Control actions don't cleanup resources | ✅ Resolved | Control actions route through manager/coordinator cleanup paths |
| WR-01 | Tests assert manual coordinator completion | ✅ Resolved | Integration tests now use plugin-style `handleSessionIdle()` |
| WR-02 | Control-action tests don't assert cleanup | ✅ Resolved | Redirect tests prove replacement Task invoked; fallback tests reject non-executed |

## Warnings

### WR-03: `manager-runtime.ts` exceeds 500 LOC module cap

**File:** `src/coordination/delegation/manager-runtime.ts:1-504`
**Issue:** The module is 504 lines, exceeding the project's 500 LOC cap (`ARCHITECTURE.md:345-353`, `CONVENTIONS.md:19-28`). This was flagged as a residual risk in the initial review and remains unfixed. The file composes all delegation sub-components (dispatcher, lifecycle, slot manager, monitor, escalation timer, notification router, retry handler) into a single runtime class, which drives the line count.
**Fix:** Extract one or two private method groups into focused helper modules — for example, `restore-from-persisted.ts` (the `restoreFromPersisted()` method with its validation/migration logic) or `health-check.ts` (the `healthCheck()` diagnostic method). Each extraction would bring the file comfortably under 500 LOC.

### WR-04: `this.client as never` bypasses type safety in manager-runtime

**File:** `src/coordination/delegation/manager-runtime.ts:211`
**Issue:** The `as never` type assertion at line 211 forces the manager's `OpenCodeClient` through `spawnDelegatedSession()`'s expected parameter type. `as never` is the most aggressive TypeScript escape hatch — it suppresses all type checking at the boundary, meaning any future signature change in `spawnDelegatedSession()` will silently pass compilation instead of surfacing a type error.
**Fix:** Replace `as never` with a targeted `as Parameters<typeof spawnDelegatedSession>[0]["client"]` or define a narrow `SpawnClient` interface that both `OpenCodeClient` and the function parameter implement. This preserves type safety while acknowledging the structural mismatch.

```typescript
// Instead of:
client: this.client as never,

// Use a narrow interface:
client: this.client as Parameters<typeof spawnDelegatedSession>[0]["client"],
```

### WR-05: `Pick<OpenCodeClient, "app">` widened to full `OpenCodeClient` in agent-resolver

**File:** `src/coordination/delegation/agent-resolver.ts:18`
**Issue:** `AgentResolverOptions.client` is typed as `Pick<OpenCodeClient, "app">` (only the `app` property), but `getAppAgents()` expects the full `OpenCodeClient`. The assertion `this.options.client as OpenCodeClient` widens a narrow type to a broad one. If `getAppAgents()` ever accesses a property beyond `app` (e.g., `client.sessions`), the runtime call would succeed but the types would have lied about the contract.
**Fix:** Either widen `AgentResolverOptions.client` to `OpenCodeClient` (honest about what's actually passed) or narrow `getAppAgents()` to accept `Pick<OpenCodeClient, "app">`. The current assertion hides the real dependency.

```typescript
// Option A — widen the options type (honest):
type AgentResolverOptions = {
  client: OpenCodeClient
  // ...
}

// Option B — narrow the consumer (if getAppAgents only uses .app):
export async function getAppAgents(client: Pick<OpenCodeClient, "app">): Promise<...>
```

## Info

### IN-01: `watchDualSignal` accepts but ignores `_childSessionId`

**File:** `src/coordination/completion/detector.ts:91`
**Issue:** The `watchDualSignal()` method signature includes `_childSessionId: string` (underscore-prefixed = intentionally unused). The dual-signal watcher is keyed solely by `delegationId`; the child session ID is accepted for the interface contract but never stored or used. This is currently safe because the SDK handler signals completion via `delegationId`, but if a future signal path needs child→delegation mapping, this parameter will need to be wired in.
**Fix:** No immediate action required. The unused parameter is documented by the underscore prefix. Consider adding a code comment explaining why it's reserved:

```typescript
// _childSessionId reserved for future child→delegation reverse-lookup
watchDualSignal(delegationId: string, _childSessionId: string, callback: ...): void {
```

---

_Reviewed: 2026-05-18_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
_Iteration: 2 (prior 8/8 findings resolved)_
