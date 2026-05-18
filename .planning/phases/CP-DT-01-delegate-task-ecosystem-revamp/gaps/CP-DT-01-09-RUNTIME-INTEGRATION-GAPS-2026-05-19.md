# CP-DT-01-09 Runtime Integration Gaps Analysis

**Date:** 2026-05-19
**Phase:** CP-DT-01-08 Surgical Remediation → CP-DT-01-09 Runtime Integration
**Status:** Investigation → Ready for Planning

## Problem Statement

Session logs `ses_1c44` và `ses_1c50` chứng minh rằng delegate-task dispatch hoạt động (child session được tạo), nhưng **KHÔNG có runtime monitoring nào được kích hoạt**. Các components đã được viết (monitor, escalation-timer, completion-detector, notification-formatter, notification-router) nhưng **không được wire vào delegation lifecycle**.

## Evidence from Live Sessions

### Session `ses_1c50` (5/18/2026, 7:02 PM - 7:13 PM)
- ✅ Delegate-task dispatch → child session created
- ❌ **NO TUI notification** khi complete
- ❌ **NO polling injection** vào parent context
- ❌ **NO failure detection** khi child stall
- ❌ **NO resume capability** sau completion

### Session `ses_1c44` (5/18/2026, 10:38 PM - 10:50 PM)
- ✅ Same pattern: dispatch OK, monitoring absent
- ❌ Child session chạy nhưng parent không nhận được signal

## Root Cause Analysis

### Gap 1: Monitor Not Wired Into DelegationManager

**File:** `src/coordination/delegation/manager.ts` (hoặc `manager-runtime.ts`)

**Current behavior:**
```
dispatch() → create child session → return delegation ID → DONE
```

**Missing:**
```
dispatch() → create child session → START MONITOR → return delegation ID
```

**Fix required:**
- `DelegationMonitor.start()` phải được gọi ngay sau khi child session được tạo
- Monitor cần được inject vào `DelegationManager` hoặc `DelegationCoordinator`
- Monitor cần access đến: `getStatus()`, `getDelegationRecord()`, `getActionCount()`, `inject()`

### Gap 2: No TUI Append Mechanism

**Problem:** Monitor inject callback được định nghĩa nhưng **không có implementation thực sự** để append vào parent session TUI.

**Current `inject` signature:**
```typescript
inject: (parentSessionId: string, line: string, delegationId?: string) => void
```

**Missing implementations:**
1. **Live session:** `session.prompt({ message: line, noReply: true })` hoặc tương đương
2. **Ended session:** Queue message + resume session với `session.promptAsync()`

**Required:**
- Hook vào `session.idle` event để detect khi parent ready
- Sử dụng OpenCode SDK `session.prompt()` hoặc `session.promptAsync()` để inject
- Fallback: queue notification và replay khi parent active

### Gap 3: No Action Count Tracking

**Problem:** `getActionCount()` trong `MonitorOptions` luôn return `0` hoặc `undefined`.

**Current behavior:**
```typescript
const actionCount = this.getActionCount?.(delegationId) ?? 0
```

**Missing:**
- Session-tracker phải capture tool calls từ child sessions
- Action count phải được update real-time khi child execute tools
- `FailureCheckpointTracker` so sánh action counts giữa các checkpoints

**Required:**
- Hook `tool.execute.after` để capture tool calls từ child sessions
- Update `Delegation.actionCount` trong real-time
- Session-tracker `tool-capture.ts` phải route action counts về monitor

### Gap 4: No Hook Integration for Completion Detection

**Problem:** `CompletionDetector` tồn tại nhưng **không được connected** với hook events.

**Current hooks registered (per SPEC):**
```typescript
hook("session.idle", handleSessionIdle)
hook("session.error", handleSessionError)
hook("session.deleted", handleSessionDeleted)
```

**Missing:**
- Hook handlers không gọi `DelegationMonitor.onCompletion()`
- Hook handlers không gọi `NotificationRouter.route()`
- Hook handlers không release concurrency slot

**Required:**
- Wire hook events → `CompletionDetector` → `DelegationMonitor.onCompletion()`
- Wire completion → `NotificationRouter.route()` → TUI append
- Wire completion → release concurrency slot → cleanup

## Architecture Fix Plan

### Step 1: Wire Monitor Into DelegationManager

**File to modify:** `src/coordination/delegation/manager-runtime.ts`

```typescript
// In dispatch() method, after child session created:
const monitor = new DelegationMonitor({
  getStatus: (id) => this.getDelegation(id)?.status ?? "unknown",
  getDelegationRecord: (id) => this.getDelegation(id),
  getActionCount: (id) => this.getActionCount(id),
  inject: (parentSessionId, line) => this.injectToParent(parentSessionId, line),
  onComplete: (id, result) => this.handleCompletion(id, result),
  onFailure: (id, result) => this.handleFailure(id, result),
})
monitor.start(delegationId, parentSessionId)
```

### Step 2: Implement TUI Append

**File to modify:** `src/features/session-tracker/session-router.ts` hoặc create `src/coordination/delegation/tui-appender.ts`

**Implementation:**
```typescript
async function injectToParent(parentSessionId: string, line: string): Promise<void> {
  try {
    // Try live append first
    await session.promptAsync(parentSessionId, {
      message: `<system_reminder>${line}</system_reminder>`,
      noReply: true,
    })
  } catch {
    // Fallback: queue for replay
    pendingNotifications.push({ parentSessionId, line })
  }
}
```

### Step 3: Wire Action Count Tracking

**File to modify:** `src/features/session-tracker/capture/tool-capture.ts`

**Implementation:**
```typescript
// In tool.execute.after hook:
hook("tool.execute.after", async (event) => {
  if (event.sessionId is child session) {
    const delegation = findDelegationByChildSession(event.sessionId)
    if (delegation) {
      delegation.actionCount = (delegation.actionCount ?? 0) + 1
      delegation.lastActionAt = Date.now()
    }
  }
})
```

### Step 4: Wire Hook Integration

**File to modify:** `src/hooks/lifecycle/session-hooks.ts`

**Implementation:**
```typescript
hook("session.idle", async (event) => {
  const delegation = findDelegationByChildSession(event.sessionId)
  if (delegation) {
    const messages = await session.messages(event.sessionId)
    monitor.checkCompletion(delegation.id, messages)
    const result = buildCompletionResult(delegation)
    notificationRouter.route(buildNotification(delegation, result))
    concurrencyQueue.release(delegation.queueKey)
  }
})
```

## Files To Modify (NO new files)

| File | Change |
|------|--------|
| `src/coordination/delegation/manager-runtime.ts` | Wire monitor.start() vào dispatch() |
| `src/coordination/delegation/manager.ts` | Add inject callback implementation |
| `src/hooks/lifecycle/session-hooks.ts` | Wire session.idle/error/deleted → monitor + notification |
| `src/features/session-tracker/capture/tool-capture.ts` | Capture action counts từ tool events |
| `src/tools/delegation/delegate-task.ts` | Return monitor status trong tool response |
| `src/tools/delegation/delegation-status.ts` | Add action count display |
| `src/coordination/delegation/notification-router.ts` | Implement TUI append logic |

## Files To Remove (Deprecated)

| File | Reason |
|------|--------|
| `src/coordination/delegation/category-gates.ts` | Rác category logic |
| `src/coordination/delegation/category-gate-audit.ts` | Rác category audit |
| Any `safetyCeiling` refs | Replaced by failure checkpoints |

## Success Criteria

1. ✅ Monitor.start() được gọi tự động khi delegate-task dispatch
2. ✅ Thin-line injection xuất hiện trong parent TUI tại 30s, 45s, 60s, 90s, 120s, 180s
3. ✅ Failure checkpoint detect stall tại 60/120/180/300s
4. ✅ Completion notification append vào parent session khi child complete
5. ✅ Action count tracking hoạt động (không còn 0 vs 0)
6. ✅ Hook events trigger completion detection + notification routing
7. ✅ `npm run typecheck` clean
8. ✅ `npm test` pass (hoặc chỉ còn pre-existing failures)

## Dependencies

- OpenCode SDK `session.prompt()` / `session.promptAsync()` API phải available
- Hook system phải support `session.idle`, `session.error`, `session.deleted` events
- Session-tracker phải capture tool calls từ child sessions

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| SDK API không available cho TUI append | Fallback: queue + replay khi parent active |
| Hook events không fire cho child sessions | Polling-based completion detection vẫn hoạt động |
| Race condition giữa hook và polling | Monitor.onCompletion() idempotent |
| Context budget overflow từ injections | Max 6 injections × 80 chars = 480 chars total |
