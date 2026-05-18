# Wave B.3 Redesign: Progressive Polling + Failure Checkpoints

**Date:** 2026-05-19
**Phase:** CP-DT-01-08 Surgical Remediation
**Status:** Design → Ready for Implementation

## Problem

Current `escalation-timer.ts` implements escalating warnings (WARN→NUDGE→ALERT→TERMINATE) — this is **fundamentally wrong**. The user's requirement is:

> "các mức 60-120 không phải là tăng dần warning mà là ở bất cứ ngưỡng nào nếu action không thay đổi so với đợt trước đều là fail task buộc agents phải đánh giá và resume"

## Correct Architecture

### 1. Progressive Polling Cadence

| Poll # | Elapsed (s) | Purpose |
|--------|-------------|---------|
| 1 | 30 | First status check, thin-line injection |
| 2 | 45 | Second status check |
| 3 | 60 | **Failure checkpoint 1** — compare actions to baseline (0) |
| 4 | 90 | Status check |
| 5 | 120 | **Failure checkpoint 2** — compare actions to checkpoint 1 |
| 6 | 180 | **Failure checkpoint 3** — compare actions to checkpoint 2 |
| — | 300 | **Failure checkpoint 4 (final)** — compare to checkpoint 3, STOP injecting after |

### 2. Failure Checkpoint Logic

```
At each checkpoint (60, 120, 180, 300):
  currentActions = getActionCount(delegationId)
  previousActions = getLastCheckpointActionCount(delegationId)
  
  if currentActions == previousActions:
    failureLevel++
    recordFailure(delegationId, failureLevel, elapsed)
    
    if failureLevel >= 4:
      injectionStopped = true  // stop all future injections
      recordFinalFailure(delegationId)
  
  updateLastCheckpointActionCount(delegationId, currentActions)
```

**Key principle:** At ANY checkpoint, if actions haven't changed since the PREVIOUS checkpoint → failure. Not cumulative, not escalating warnings. Each checkpoint is independent.

### 3. Thin-Line Injection Format

Each poll (while NOT injectionStopped) injects:

```
[DT:{delegationId}] status={status} | agent={agent} | tools={toolCount} | actions={actionCount}
```

This is minimal, deterministic, and tells the main agent:
- Session is still alive
- What agent is running
- How many tools/actions have been executed
- Current delegation status

### 4. Completion Detection (3 conditions — ALL must be true)

1. **Tool activity > 1 minute:** Tools have been running for at least 60 seconds
2. **Assistant last message exists:** Agent produced a summary/report of results
3. **File changes detected:** For tasks that create/modify files, verify file mutations occurred

When all 3 are true → success notification.

### 5. Success Notification

Format:
```
<system_reminder>
[DT:{id}] ✅ Complete | agent={name} | {elapsed}
Task: {description}
Result: {summary}
Path: {file_path}
Timestamp: {ISO}
File changes: {count} files modified
</system_reminder>
```

- If main session **live** → direct TUI append (no queue)
- If main session **ended** → queue message + resume session

### 6. Failure Notification

Two failure levels:

| Level | Condition | Notification |
|-------|-----------|--------------|
| **executed-running-fail** | Session started and ran tools, but stalled at checkpoint | `[DT:{id}] ⚠ Stall failure (level {n}) | agent={name} | last actions={count} at {elapsed}s` |
| **fail-from-threshold** | Session never executed tools, failed at first checkpoint | `[DT:{id}] ❌ Execution failure | agent={name} | no actions recorded` |

### 7. Concurrency

- Max 10 delegation slots **per main session**
- Notifications routed to correct parent session ID
- No cross-session pollution

### 8. Control Actions (Wave B.4, but design here for completeness)

| Action | Behavior |
|--------|----------|
| `abort` | Kill child session immediately |
| `cancel` | Graceful cancellation |
| `restart` | Re-dispatch with same params |
| `resume` | `session.promptAsync()` with same session ID, preserve context |
| `chain` | New prompt into existing completed session (context continuity) |
| `adjust-prompt` | Modify prompt for running session |
| `change-agent` | Change agent for resume (context preserved) |

## Files to Modify

### `src/coordination/delegation/types.ts`
- Add `FailureCheckpointResult` type
- Add `DelegationCheckpointState` interface
- Keep `ESCALATION_THRESHOLDS` but rename semantics

### `src/coordination/delegation/escalation-timer.ts` → **REWRITE**
- Remove WARN/NUDGE/ALERT escalating warnings
- Implement failure checkpoint comparison logic
- Track `lastCheckpointActionCount` per delegation
- Support `onFailureCheckpoint(level, elapsed, actionCount)` callback
- Support `onFinalFailure(delegationId)` callback at 300s

### `src/coordination/delegation/monitor.ts` → **REWRITE**
- Progressive polling at 30→45→60→90→120→180
- At each poll: inject thin-line via formatter
- At failure checkpoints: compare action counts, record failures
- Stop injecting after final failure (300s, level 4)
- Integrate completion detector (3 conditions)
- Route success/failure notifications via notification-formatter

### `src/coordination/delegation/notification-formatter.ts`
- Already created in Wave B.2 — extend with failure notification formats

### `tests/lib/coordination/delegation/escalation-timer.test.ts`
- Rewrite tests for failure checkpoint logic

### `tests/lib/coordination/delegation/monitor.test.ts`
- Rewrite tests for progressive polling + failure detection

## Implementation Plan

1. **Step 1:** Update `types.ts` — add failure checkpoint types
2. **Step 2:** Rewrite `escalation-timer.ts` — failure checkpoint comparison logic
3. **Step 3:** Rewrite `monitor.ts` — progressive polling + failure detection + completion integration
4. **Step 4:** Extend `notification-formatter.ts` — failure notification formats
5. **Step 5:** Rewrite tests
6. **Step 6:** Verify `npm run typecheck` + `npm test`

## Success Criteria

1. Polling at 30→45→60→90→120→180 with thin-line injection
2. Failure checkpoints at 60/120/180/300 compare action counts
3. No change = failure at that level
4. Stop injecting after level 4 failure (300s)
5. Completion detection (3 conditions) triggers success notification
6. Failure notifications distinguish executed-running-fail vs fail-from-threshold
7. All tests pass, typecheck clean
