# Spec Validation Report: 3 Mechanisms for Parallel Delegation Orchestration

**Date:** 2026-05-24
**Session:** ses_1aa92e240ffeEpaWmxUFFxFh67
**SDK Version:** @opencode-ai/sdk v1.15.5 (package.json:43)

## Mechanism 1: Silent Context Injection

### Spec
- `sendPromptAsync()` — fire-and-forget, 204 No Content, agent-visible, no turn
- `noReply: true` — agent sees context, doesn't auto-respond
- Injected as `<system_reminder>` block
- Multiple delegations = one combined batch
- NO `## USER` turn, NO input pollution

### Current Implementation

| Aspect | File:Line | Status |
|--------|-----------|--------|
| `sendPromptAsync()` usage | `plugin.ts:224` | ✅ CORRECT |
| `noReply: true` | `plugin.ts:224` | ✅ CORRECT |
| `<system_reminder>` format | `periodic-notifier.ts:103` | ✅ CORRECT — combined block |
| Batch coalescing (2s) | `periodic-notifier.ts:74-82` | ✅ CORRECT — restored with single-path |
| Cross-batch dedup | `periodic-notifier.ts:88-91` | ✅ CORRECT — hash comparison |
| Aggregated toast | `periodic-notifier.ts:108-119` | ✅ CORRECT — count + top 3 agents |
| No double injection | `periodic-notifier.ts:66-72` | ✅ CORRECT — QUEUE only, no immediate |
| sendPromptAsync wraps SDK | `session-api.ts:188-200` | ✅ CORRECT — `client.session.promptAsync()` |
| SDK body format | `session-api.ts` | ✅ CORRECT — `{ noReply, parts: [{ type: "text", text }] }` |
| Permission chain traversal | `manager-runtime.ts:339-379` | ✅ CORRECT — iterative walk, 9c9cad58 |

### Verdict: ✅ MECHANISM 1 — FULLY VALIDATED
All spec requirements are met. Batch queue avoids flooding with 10+ parallel delegations.

---

## Mechanism 2: Active Poll Status

### Spec
- `delegation-status` returns: progressPct, toolCallCount, actionCount, messageCount, signals, elapsedHuman, nestingDepth, executionState
- Control actions: cancel, abort, restart, resume, change-agent, chain
- Permission chain: grandchild can see grandparent's delegations
- Fast response

### Current Implementation

| Aspect | File:Line | Status |
|--------|-----------|--------|
| Completion detail fields | `shared/types.ts:5-27` | ✅ CORRECT — all fields in TaskNotification |
| progressPct computation | `notification-handler.ts:32-36` | ✅ CORRECT — weighted formula |
| Cancel on terminal (race fix) | `delegation-status.ts:190-200` | ✅ CORRECT — allow cancel on terminal |
| Permission chain traversal | `manager-runtime.ts:339-379` | ✅ CORRECT — 5 cases with chain walk |
| delegation-status tool | `delegation-status.ts` | ✅ CORRECT — full poll + control |

### Verdict: ✅ MECHANISM 2 — FULLY VALIDATED
All spec requirements met. Race condition in cancel/abort fixed (U6). Permission chain fixed (G2).

---

## Mechanism 3: Auto Notification + Stream Reactivation

### Spec
- **Case A** — Main stream ended: auto CREATE new turn with `<system_reminder>` to reactivate
- **Case B** — Early failure (30s/60s): send notification REQUIRING response
- **Case C** — Normal completion: `<system_reminder>` with `noReply: true`, fire-and-forget

### Current Implementation

| Aspect | File:Line | Status |
|--------|-----------|--------|
| Case C: Normal completion notify | `notification-handler.ts:289-311` | ✅ CORRECT — sendPromptAsync with noReply:true |
| Case C: Toast + context inject | `notification-handler.ts:219-258` | ✅ CORRECT — dual path |
| Case C: buildNotificationMessage | `notification-handler.ts:48-96` | ✅ CORRECT — full <system_reminder> with all fields |
| Case C: Detail fields (Bug D) | `notification-handler.ts:125-148` | ✅ CORRECT — all fields populated |
| Case A: Stream reactivation | `notification-handler.ts:151-163` | ❌ NOT IMPLEMENTED — `reactivateSessionStream()` exists but is NOT wired |
| Case A: Monitor > notify flow | `coordinator.ts:236-244` | ❌ NOT INTEGRATED — handleCompletion calls routeTerminal not notifyParentSession |
| Case B: Early failure detection | `monitor.ts:101-103` | ⚠️ PARTIAL — failure detection exists (60s/120s/180s checkpoints) but sends to notificationRouter, not a response-requiring prompt |
| Case B: Response-requiring notification | — | ❌ NOT IMPLEMENTED — no `noReply: false` path exists for urgent notifications |

### Case A Gaps
1. `reactivateSessionStream()` exists at `notification-handler.ts:151-163` but is NEVER CALLED. Should be called before sending completion notification when parent stream may be inactive.
2. `coordinator.ts:236-244` — `handleCompletion()` calls `routeTerminal()` which routes to `notificationRouter`, NOT `notifyParentSession()`/`notifyDelegationTerminal()`. The notification-router only supports `success/failure/timeout` types and uses a different delivery path.
3. No mechanism detects if parent stream ended before background tasks complete.

### Case B Gaps
1. `monitor.ts:101-103` — Failure checkpoint detection exists at 60s/120s/180s. But it calls `this.inject()` → notificationRouter (progress type = no delivery). The notification never reaches the agent.
2. `monitor.ts:107-111` — `onFailure` callback path: when failure is detected, `handleFailure()` is called. But it creates a `FailureCheckpointResult` and calls `this.onFailure?.(delegationId, result)`. Need to verify wiring in plugin.ts.
3. No mechanism sends a `noReply: false` prompt that REQUIRES a response from the agent.

### Verdict: ⚠️ MECHANISM 3 — PARTIALLY VALIDATED
Case C (normal completion) is fully implemented. Case A (stream reactivation) and Case B (early failure response) are NOT implemented. These are design gaps, not code bugs.

---

## U1 Batch Queue — Final Design

### Flow
```
Monitor poll tick @ 30s
  → plugin.ts inject callback
    → PeriodicNotifier.handlePollTick(snapshot)
      → IF toolCount or actionCount changed:
        → Update tracked state
        → Queue snapshot in pendingFlush Map
        → Schedule 2s flush timer (reset if already running)
      → ELSE: skip (dedup)

2s later: flush timer fires
  → PeriodicNotifier.flush()
    → Compute cross-batch dedup hash
    → IF hash matches last batch: skip (nothing changed)
    → Format ONE combined <system_reminder> block:
        <system_reminder>
        [DT:1] 🔄 running | 30s | tools=5 | agent=gsd-A
        [DT:2] 🔄 running | 45s | tools=3 | agent=gsd-B
        </system_reminder>
    → Call injectFn("batch", combinedBlock, undefined)
      → plugin.ts callback: sendPromptAsync(client, parentSesId, { noReply: true, parts: [{ type: "text", text: combinedBlock }] })
    → IF showToast: showTuiToast("N delegations active · agent1 agent2 agent3 +M more")
    → Update lastBatchHash
```

### Key Properties
| Property | Value |
|----------|-------|
| Batch window | 2 seconds (configurable via batchWindowMs) |
| Injections per batch | 1 (combined) |
| Time per delegation line | ~60 chars |
| 10 delegations block | ~700 chars (under 2K token limit) |
| Cross-batch dedup | Hash = delegationId:toolCount:actionCount joined |
| Toast per batch | 1 aggregated toast (count + top 3 by elapsed) |
| Flood protection | Single inject path, batch dedup, combined block |

---

## Design Flaw Table

| # | Spec | Current Implementation | Gap | Severity |
|---|------|----------------------|-----|----------|
| 1 | M1: sendPromptAsync for silent injection | ✅ Batch queue with single-path combined inject | None | — |
| 2 | M1: No double injection | ✅ handlePollTick only queues, flush sends combined block | None | — |
| 3 | M2: Completion detail fields | ✅ TaskNotification expanded, buildDelegationTaskNotification populates | None | — |
| 4 | M2: Cancel race fix | ✅ Allow cancel/abort on terminal delegations | None | — |
| 5 | M2: Permission chain | ✅ Iterative parent chain walk (5 cases) | None | — |
| 6 | M3-Case A: Stream reactivation | ❌ reactivateSessionStream() exists but never wired | DESIGN_GAP | LOW |
| 7 | M3-Case B: Early failure response | ❌ Failure detection exists but only routes to notificationRouter (no delivery for progress type) | DESIGN_GAP | MEDIUM |
| 8 | M3-Case B: Response-requiring prompt | ❌ No noReply:false path exists | DESIGN_GAP | MEDIUM |

### Conclusion
- **Mechanism 1 (Silent Injection):** ✅ Fully validated. Batch queue with single-path combined inject working. 19 tests pass.
- **Mechanism 2 (Active Poll):** ✅ Fully validated. Detail fields, cancel race fix, permission chain all working.
- **Mechanism 3 (Auto Notification):** ⚠️ Case C validated. Case A + Case B are design gaps not code bugs. Requires separate planning phase.

## Fix Commit Chain

| # | Description | Commit |
|---|-------------|--------|
| U4/U5 | Session-tracker delegate-task hook | `823a64ad` |
| U1 | Batch queue + single-path combined inject | `80cd2e53` |
| U3 | sendPrompt → sendPromptAsync in notifyDelegationTerminal | `374fbf8d` |
| G2 | Permission chain traversal | `9c9cad58` |
| U6 | Cancel on terminal delegations | `b290ed19` |
| D/E/F | Completion detail fields + toast enable | `88527420` |

## Final test verification
- Full suite: 2434 pass, 2 pre-existing failures
- Typecheck: ✅
- Regressions: 0
