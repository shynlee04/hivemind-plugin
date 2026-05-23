---
phase: 23
title: "Design: Periodic Silent Injection for Delegation Progress"
status: design-draft
created: 2026-05-23
author: gsd-debugger (subagent)
source_files:
  - src/coordination/delegation/monitor.ts
  - src/coordination/delegation/coordinator.ts
  - src/coordination/completion/notification-handler.ts
  - src/coordination/delegation/notification-formatter.ts
  - src/coordination/delegation/notification-router.ts
  - src/coordination/delegation/types.ts
  - src/coordination/delegation/manager-runtime.ts
  - src/shared/session-api.ts
  - .planning/phases/23-notification-fix-and-tool-surface-docs/23-GAP-PLAN-NOTIFICATION.md
---

# Design: Periodic Silent Injection for Delegation Progress

## 1. Problem Statement

**Bug 1 (Feature Gap):** Parent sessions receive no progress updates while a child delegation is running. The parent session sees a "started" toast at dispatch and a completion/failure notification at termination — but nothing in between.

**Impact:** User cannot tell if a long-running delegation is alive, stalled, or making progress. For delegations lasting 5+ minutes, the parent session appears frozen.

**Scope:** Design a periodic silent injection system that:
1. Uses a graduated cadence (30s → 45s → 60s → 90s → 120s → 180s → then every 60s)
2. Injects thin status lines (< 120 chars) into the parent session via `session.promptAsync()`
3. Deduplicates — skips injection when nothing changed since last update
4. Batches — coalesces multiple running delegations into a combined update
5. Handles 10+ concurrent delegations without flooding

**NOT in scope:** Terminal notifications (already handled by `notification-router.ts` + `notification-handler.ts`).

---

## 2. Current Flow Map

### 2.1 Polling Loop (`monitor.ts`)

```
DelegationMonitor.start(delegationId, parentSessionId)
  → Creates setInterval using POLLING_CADENCE array
  → Each tick calls poll() → getSessionMessages() on child session
  → Calculates: messageDelta, toolDelta, actionCount, stablePollCount
  → Calls inject(parentSessionId, formatStatusLine(...), delegationId)
  → On completion: inject(parentSessionId, terminalLine) + onComplete()
  → On stable stall (3+ stable polls): onFirstActionDeadline()
```

**POLLING_CADENCE** (from `types.ts`):
```typescript
export const POLLING_CADENCE = [30, 45, 60, 90, 120, 180] // seconds
```

After the last cadence entry (180s), polling continues at 180s intervals until completion.

### 2.2 Inject Callback Wire

```
plugin.ts → setupDelegationModules()
  → monitor = new DelegationMonitor(client, {
      inject: (parentSessionId, line, delegationId) => {
        // Current: APPENDS to TUI prompt input — causes pollution!
        // Was: void appendTuiPrompt(client, line)
        // After Bug 2 fix: does nothing for non-terminal updates
      },
      onComplete: (delegationId) => coordinator.handleCompletion(...),
      onFailure: (delegationId, error) => coordinator.handleTimeout(...),
      onFirstActionDeadline: (delegationId, elapsed) => coordinator.markExecutionUnconfirmed(...),
      onAutoAbort: (delegationId) => coordinator.abortDelegation(...)
    })
```

**Key observation:** The `inject` callback is ALREADY wired and called on every poll tick. The problem is that it currently does nothing useful for progress updates (after `appendTuiPrompt` was identified as polluting).

### 2.3 Notification Router Gate

```
notification-router.ts → isParentFacingNotification(type)
  → Only allows: "success" | "failure" | "timeout"
  → Rejects: "progress" | any other type
```

This means the existing `NotificationRouter` cannot be used for periodic progress injection without modification.

### 2.4 Status Line Formatting

```
monitor.ts → formatStatusLine(record)
  → If terminal: uses formatCompactLine() → "[ses_xxx → agent] completed | tools:5 1m30s"
  → If running: raw format → "[ses_xxx → agent] running | actions:15 stable:3 2m30s"
```

**`formatCompactLine()`** (from `notification-formatter.ts`):
```typescript
export function formatCompactLine(sessionId: string, agent: string, status: string, counters: string, duration: string): string
// Returns: `[${shortId} → ${agent}] ${status} | ${counters} | ${duration}`
```

### 2.5 Available SDK APIs

| API | Returns | Turn Created | Agent Visible | Use For |
|-----|---------|-------------|---------------|---------|
| `tui.showToast()` | `boolean` | NO | NO | Transient toast (progress, started) |
| `session.promptAsync()` | `204 No Content` | NO (fire-and-forget) | YES (adds to stream context) | Silent context injection |
| `session.prompt({ noReply: true })` | `UserMessage` | YES — ## USER | YES | **DO NOT USE** for notifications |
| `tui.appendPrompt()` | `boolean` | NO (pollutes input) | NO | **DO NOT USE** — causes pollution |

**Key:** `session.promptAsync()` is the ideal injection mechanism — fire-and-forget, agent-visible, no turn pollution.

---

## 3. Design: PeriodicNotifier

### 3.1 Architecture Options

#### Option A: Extend `monitor.ts` inject callback

**Approach:** Modify the existing `inject` callback in `plugin.ts` to call `sendPromptAsync()` directly.

| Pro | Con |
|-----|-----|
| Minimal new code | Couples injection logic to plugin composition root |
| Reuses existing polling cadence | No dedup or batch coalescing |
| No new files | Hard to test in isolation |

#### Option B: Add `notifyParentSession()` calls in coordinator

**Approach:** Coordinator calls `notifyParentSession()` periodically via timer.

| Pro | Con |
|-----|-----|
| Coordinator already owns delegation lifecycle | Coordinator is already 456 LOC (near 500 limit) |
| Central dispatch point | Timer management doesn't belong in coordinator |
| Testable | Violates SRP — coordinator is orchestration, not notification scheduling |

#### Option C: New `PeriodicNotifier` class (RECOMMENDED)

**Approach:** Dedicated class that:
1. Subscribes to monitor's inject callback
2. Maintains per-delegation snapshot (last injected state)
3. Deduplicates unchanged states
4. Batches multiple delegations into combined updates
5. Calls `sendPromptAsync()` with thin formatted lines

| Pro | Con |
|-----|-----|
| Single Responsibility Principle | New file (but small, ~150 LOC) |
| Testable in isolation | Requires wiring in plugin.ts |
| Dedup + batch built-in | — |
| Fits 9-surface model (Coordination layer) | — |
| Decoupled from monitor internals | — |

**Decision: Option C** — New `PeriodicNotifier` class under `src/coordination/delegation/periodic-notifier.ts`.

### 3.2 Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│ plugin.ts (composition root)                            │
│                                                         │
│  DelegationMonitor ────inject()────▶ PeriodicNotifier   │
│                                         │               │
│                                    ┌────┴────┐          │
│                                    │ dedup   │          │
│                                    │ batch   │          │
│                                    │ cadence │          │
│                                    └────┬────┘          │
│                                         │               │
│                                    sendPromptAsync()     │
│                                    showTuiToast()        │
│                                         │               │
│                                    parent session        │
└─────────────────────────────────────────────────────────┘
```

### 3.3 PeriodicNotifier Interface

```typescript
// src/coordination/delegation/periodic-notifier.ts

export interface PeriodicNotifierConfig {
  /** Maximum concurrent delegations to track before forced batch */
  readonly maxTrackedDelegations: number; // default: 20
  /** Minimum characters of change required to inject (dedup threshold) */
  readonly dedupThreshold: number; // default: 0 (any change triggers)
  /** Whether to also show toast on each injection */
  readonly showToast: boolean; // default: true
  /** Maximum line length for injected status */
  readonly maxLineLength: number; // default: 120
}

export interface DelegationSnapshot {
  readonly delegationId: string;
  readonly parentSessionId: string;
  readonly agent: string;
  readonly childSessionId: string;
  readonly status: "running";
  readonly actionCount: number;
  readonly toolCallCount: number;
  readonly messageCount: number;
  readonly stablePollCount: number;
  readonly elapsedSeconds: number;
}

export class PeriodicNotifier {
  constructor(
    client: OpenCodeClient,
    config?: Partial<PeriodicNotifierConfig>
  );

  /**
   * Called by monitor's inject callback on each poll tick.
   * Performs dedup check and queues injection if state changed.
   */
  handlePollTick(
    parentSessionId: string,
    line: string,
    delegationId?: string
  ): void;

  /**
   * Register a new delegation for tracking.
   * Called when monitor.start() is invoked.
   */
  register(delegationId: string, parentSessionId: string, agent: string, childSessionId: string): void;

  /**
   * Deregister a completed/failed delegation.
   * Called when monitor.onCompletion() is invoked.
   */
  deregister(delegationId: string): void;

  /**
   * Force-flush all pending injections.
   * Called before terminal notification to ensure last progress line is sent.
   */
  flush(): Promise<void>;

  /**
   * Returns count of currently tracked delegations.
   */
  readonly activeCount: number;
}
```

### 3.4 Deduplication Strategy

**Snapshot comparison:** On each `handlePollTick()`, the notifier compares the new line against the last injected line for that delegation:

```typescript
private lastInjected = new Map<string, string>(); // delegationId → last line

handlePollTick(parentSessionId: string, line: string, delegationId?: string): void {
  if (!delegationId) return;

  const lastLine = this.lastInjected.get(delegationId);
  if (lastLine === line) {
    // Exact string match — nothing changed, skip injection
    this.stats.skippedDuplicates++;
    return;
  }

  // State changed — queue for injection
  this.lastInjected.set(delegationId, line);
  this.pendingUpdates.set(delegationId, { parentSessionId, line });
  this.scheduleFlush();
}
```

**What changes between polls:**
- `actionCount` increments (new tool calls)
- `toolCallCount` increments
- `messageCount` increments
- `stablePollCount` increments when no new actions
- `elapsedSeconds` always changes

Since `elapsedSeconds` always changes, the formatted line will always differ. **To avoid noise, the dedup should compare WITHOUT the duration field:**

```typescript
private stripDuration(line: string): string {
  // Remove trailing "| XmYs" or "| Xs" duration pattern
  return line.replace(/\s*\|\s*\d+m?\d*s$/, "");
}
```

This way, if only the duration changed but no new actions/tools/messages, the injection is skipped.

### 3.5 Batch Coalescing

When multiple delegations run for the same parent session, inject a combined line:

```
[3 delegations running] ses_aaa→agent1: tools:5 | ses_bbb→agent2: actions:12 | ses_ccc→agent3: tools:2 bash:1 | 4m15s
```

**Batching logic:**

```typescript
private scheduleFlush(): void {
  if (this.flushTimer) return; // already scheduled

  // Coalesce within 2-second window
  this.flushTimer = setTimeout(() => {
    this.flushTimer = undefined;
    void this.flush();
  }, 2000);
}
```

**Combined format:**
- 1 delegation: `[ses_xxx → agent] running | tools:5 bash:2 actions:8 | 2m30s`
- 2-3 delegations: `[N running] ses_aaa→agent1: tools:5 | ses_bbb→agent2: actions:12 | 4m15s`
- 4+ delegations: `[N running] agent1:5 tools, agent2:12 actions, agent3:2 tools +M more | total: 8m`

### 3.6 Injection Mechanism

**Primary:** `session.promptAsync()` — fire-and-forget context injection.

```typescript
private async injectLine(parentSessionId: string, line: string): Promise<void> {
  try {
    await sendPromptAsync(this.client, parentSessionId, {
      parts: [{ type: "text", text: line, synthetic: true }],
    });
  } catch {
    // Fire-and-forget — log but don't throw
    this.client.app?.log?.("error", `[PeriodicNotifier] injection failed for ${parentSessionId}`);
  }

  // Also show toast (best-effort)
  if (this.config.showToast) {
    try {
      await showTuiToast(this.client, line);
    } catch { /* best-effort */ }
  }
}
```

### 3.7 Graduated Cadence (Reuse from Monitor)

The monitor already implements the graduated cadence via `POLLING_CADENCE`. The `PeriodicNotifier` does NOT need its own timer — it piggybacks on the monitor's existing poll ticks.

**Flow:**
1. Monitor polls at 30s → calls `inject(parentSessionId, line, delegationId)`
2. `PeriodicNotifier.handlePollTick()` receives the tick
3. Dedup check → if changed, queue for injection
4. Batch coalesce (2s window)
5. Inject combined line via `sendPromptAsync()`

**No additional timers needed.** The cadence is entirely controlled by the monitor's polling schedule.

### 3.8 Edge Cases

| Case | Behavior |
|------|----------|
| Delegation completes between polls | Monitor calls `onComplete()` → notifier deregisters → no stale injection |
| Parent session stopped/streaming ended | `sendPromptAsync()` fails silently → no crash, logged |
| 10+ concurrent delegations | Batching coalesces into single combined line per flush |
| No state change (only duration differs) | Dedup strips duration → skips injection |
| First poll after dispatch | Always injects (no previous state to compare) |
| Monitor tick with no delegationId | Ignored (safety check in handlePollTick) |
| Flush called during terminal notification | Force-flushes pending lines before terminal notification is sent |

### 3.9 Error Handling

- `sendPromptAsync()` failure: Log via `client.app?.log?.()`, increment `stats.injectionFailures`, do NOT throw.
- `showTuiToast()` failure: Best-effort, silently ignored.
- Registration of delegation that's already tracked: Overwrite previous snapshot (idempotent).
- Deregistration of unknown delegation: No-op.

---

## 4. Integration Points

### 4.1 Wiring in `plugin.ts`

```typescript
// In setupDelegationModules():

const periodicNotifier = new PeriodicNotifier(client, {
  maxTrackedDelegations: 20,
  showToast: true,
  maxLineLength: 120,
});

const monitor = new DelegationMonitor(client, {
  inject: (parentSessionId, line, delegationId) => {
    periodicNotifier.handlePollTick(parentSessionId, line, delegationId);
  },
  onComplete: (delegationId) => {
    periodicNotifier.deregister(delegationId);
    coordinator.handleCompletion(delegationId, ...);
  },
  onFailure: (delegationId, error) => {
    periodicNotifier.deregister(delegationId);
    coordinator.handleTimeout(delegationId);
  },
  onFirstActionDeadline: (delegationId, elapsed) => {
    coordinator.markExecutionUnconfirmed(delegationId, elapsed);
  },
  onAutoAbort: (delegationId) => {
    periodicNotifier.deregister(delegationId);
    coordinator.abortDelegation(delegationId);
  },
});
```

### 4.2 Registration in Coordinator

When `coordinator.dispatch()` starts monitoring:

```typescript
// coordinator.ts:139 (existing)
this.deps.monitor.start(delegationId, params.parentSessionId);

// ADD: Register with periodic notifier
this.periodicNotifier?.register(delegationId, params.parentSessionId, params.agent, record.childSessionId);
```

### 4.3 Flush Before Terminal

In `coordinator.handleCompletion()`:

```typescript
// coordinator.ts:227 (existing)
async handleCompletion(delegationId: string, result: DelegationResult): void {
  await this.periodicNotifier?.flush(); // Ensure last progress line is sent
  // ... existing cleanup
}
```

---

## 5. File Changes

| File | Action | LOC Impact | Description |
|------|--------|-----------|-------------|
| `src/coordination/delegation/periodic-notifier.ts` | CREATE | ~150 | New PeriodicNotifier class |
| `src/coordination/delegation/coordinator.ts` | MODIFY | +5 | Register/deregister/flush calls |
| `src/plugin.ts` | MODIFY | +8 | Wire PeriodicNotifier in setupDelegationModules |
| `src/coordination/delegation/types.ts` | MODIFY | +1 | Export DelegationSnapshot type |
| `tests/lib/coordination/delegation/periodic-notifier.test.ts` | CREATE | ~200 | Unit tests for dedup, batch, injection |

**Total new code:** ~360 LOC (implementation + tests)
**Total modified code:** ~14 LOC

---

## 6. Dependency Rules Check

| Rule | Status |
|------|--------|
| `periodic-notifier.ts` imports only from `shared/` and `notification-formatter.ts` | ✅ OK — leaf-like |
| No circular dependencies | ✅ OK — new file, no back-imports |
| Module < 500 LOC | ✅ OK — ~150 LOC |
| `plugin.ts` stays as assembly file | ✅ OK — only wiring changes |
| CQRS boundary respected | ✅ OK — PeriodicNotifier is write-side (coordination) |

---

## 7. Testing Strategy

### 7.1 Unit Tests

```
PeriodicNotifier
  ├── handlePollTick
  │   ├── should inject on first tick (no previous state)
  │   ├── should skip injection when only duration changed
  │   ├── should inject when actionCount changed
  │   ├── should inject when toolCallCount changed
  │   └── should ignore tick without delegationId
  ├── batch coalescing
  │   ├── should combine 2 delegations into single injection
  │   ├── should combine 3+ delegations into compact format
  │   └── should flush separately for different parent sessions
  ├── register/deregister
  │   ├── should track new delegation
  │   ├── should remove delegation on deregister
  │   └── should handle deregister of unknown delegation
  ├── flush
  │   ├── should force-inject all pending updates
  │   └── should handle sendPromptAsync failure gracefully
  └── edge cases
      ├── should handle 10+ concurrent delegations
      ├── should reset on re-registration
      └── should coalesce within 2s window
```

### 7.2 Integration Test

```
coordinator + monitor + periodicNotifier
  ├── should inject progress line on first poll tick
  ├── should inject progress line when tool count changes
  ├── should NOT inject when only duration changes
  ├── should deregister on completion
  └── should flush before terminal notification
```

---

## 8. Open Questions

| # | Question | Status | Decision |
|---|----------|--------|----------|
| 1 | Should `showToast` be on by default? | Open | Recommended YES — provides user-visible feedback without pollution |
| 2 | Should the 2s batch window be configurable? | Open | Start with hardcoded, add config if needed |
| 3 | Should `PeriodicNotifier` track its own cadence or rely entirely on monitor ticks? | Decided | **Rely on monitor ticks** — no additional timers |
| 4 | Should the combined batch format show individual session IDs? | Open | YES for ≤3 delegations, compact for 4+ |
| 5 | Should `periodicNotifier.register()` be called from coordinator or from the monitor.start callback? | Open | **From coordinator** — coordinator owns delegation lifecycle |

---

## 9. Implementation Order

1. Create `periodic-notifier.ts` with interface and dedup logic
2. Add unit tests for PeriodicNotifier
3. Wire in `plugin.ts` composition root
4. Add register/deregister calls in `coordinator.ts`
5. Add flush-before-terminal in `coordinator.ts`
6. Run typecheck + test suite
7. Live UAT: dispatch delegation, observe periodic injections in parent session
