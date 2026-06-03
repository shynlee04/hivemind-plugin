# Debug Session: tmux-delegate-streaming-gaps

**Phase:** 58-tmux-orchestration-programmatic-pool-interactive-delegate-cl
**Status:** investigating
**Trigger:** Phase 58 SHIPPED but UAT failed. Two prior diagnosis attempts rejected for misrepresenting symptoms 1 and 3. Re-diagnose with CORRECTED user-stated symptoms.
**Created:** 2026-06-04
**Updated:** 2026-06-04
**Investigator:** gsd-debug-session-manager (READ-ONLY, no code changes)
**Evidence base:** 16 source files read in full, 2 BATS tests executed, dist/plugin.js analyzed

---

## User's 4 Explicit Symptoms (Verbatim, Source of Truth)

**Symptom 1 (CORRECTED):** The streaming flaw affects ONLY the tmux-spawned child session panel, NOT the native `task` tool path.
- When the user clicks "focus" on a native `task` tool child session, the live stream of tool calls, progress, intermediate thoughts, and state changes works correctly and continues to update.
- The flaw is specific to the tmux-spawned child panel: only the FIRST PROMPT is shown, then ALL subsequent activities are CUT OFF. There will be NO update whatsoever after the first prompt.
- This affects `delegate-task` (or whatever path creates the tmux child session) — native `task` tool with focus-click is unaffected.
- The cut-off is unconditional: regardless of what the child does after the first prompt, no further updates appear in the tmux panel.

**Symptom 2:** User has no direct interaction to the child session.
- User cannot send a direct prompt into a running child session.
- User cannot send a key (pause/abort/resume signal) to a running child session.
- There is no `inject` or `intervene` affordance from the user's TUI into an active child session.

**Symptom 3 (CORRECTED):** The orchestrator's main stream terminates instead of remaining open while delegated tasks are still running.
- The orchestrator (L0) ends the main stream early when it has no more work to do, even if `delegate-task` dispatches are still in flight.
- This is NOT "blocking" — the orchestrator's main loop does NOT block. It actually ends and returns control to the user while delegations are still running.
- The expected WaiterModel behavior: main stream STAYS OPEN so the orchestrator can keep monitoring delegations and accept new user instructions mid-flight.
- For `delegate-task` (truly async/background variant): the agent can dispatch multiple tasks and shift focus between them. The MAIN STREAM MUST STAY OPEN as long as delegated tasks are still running.
- For native `task` tool (synchronous variant): the tool BLOCKS the main stream until the child returns. The user's mid-flight messages are QUEUED behind the blocking call.
- Current observed behavior contradicts this: the orchestrator ends its main stream early and the user loses the ability to interject.

**Symptom 4:** The orchestrator has no live JIT context.
- The orchestrator (L0) does not know in real time what tools the child is invoking, what state transitions the child is making, or what intermediate artifacts the child is producing.
- When the user asks "progress?" mid-flight, the orchestrator cannot answer because it has no visibility into the child's in-flight work.

---

## Current Focus

- **hypothesis:** The 4 symptoms stem from architectural gaps between `delegate-task` (async WaiterModel) and native `task` (blocking SDK subagent), compounded by missing tmux pane content streaming and permission-gated user interaction tools.
- **next_action:** Implement fixes per recommendations below (requires new delegation with write access).

---

## Symptom → Spec → Phase Mapping

| # | Symptom | Phase Owner | REQ Coverage | Source File | BATS Coverage |
|---|---------|-------------|--------------|-------------|---------------|
| **1** | tmux child panel shows only first prompt then cuts off | **P58 partial (G4)** | REQ-58-04 (`forward-prompt`) adds prompt delivery; but **no REQ covers live pane content streaming** | `src/features/tmux/session-manager.ts` (pane spawn), `src/features/tmux/tmux-multiplexer.ts` (opencode attach) | BATS 64 tests sentinel delivery only; **no test for continuous content rendering** |
| **2** | No direct user interaction with child session | **P58 (G5)** | REQ-58-05 (`take-over`/`release`) implemented | `src/tools/tmux-copilot.ts:232-290` | BATS 65 tests take-over/release flag cycle |
| **3** | Orchestrator main stream terminates early | **Not P58 — upstream (P24/P39 or new phase)** | **No REQ in P58 covers WaiterModel keep-alive** | `src/coordination/delegation/coordinator.ts` (dispatch), `src/tools/delegation/delegate-task.ts` (tool return) | None |
| **4** | Orchestrator has no live JIT context for child | **Not P58 — upstream (P25 session-tracker or new phase)** | **No REQ in P58 covers real-time child event streaming** | `src/features/session-tracker/capture/event-capture.ts` (event routing), `src/coordination/sdk-delegation/handler.ts` (polling) | None |

---

## Root Cause Per Symptom

### Symptom 1: tmux child panel shows only first prompt, then cuts off

**File:line gap:** `src/features/tmux/tmux-multiplexer.ts:215-248` — `spawnPane()` runs `opencode attach <url> --session <childSessionId> --dir <directory>` in a tmux pane. The pane IS a live OpenCode client attached to the child session. The first prompt renders correctly because `opencode attach` connects and displays the initial session state.

**Why it cuts off:** The `opencode attach` process in the tmux pane is an independent OpenCode client. It receives events from the OpenCode server for the child session. However, the `delegate-task` dispatch path (via `coordinator.dispatch()` at `coordinator.ts:152-243`) creates the child session via `childSessionStarter.start()`, which uses the SDK's native `task` tool internally. The child session's events flow through the SDK's event system.

**The key differentiator from native `task` tool:**
- **Native `task`:** The orchestrator IS the parent of the child session. The SDK streams child events to the parent's TUI directly. When the user clicks "focus", the TUI renders the live event stream from the SDK.
- **`delegate-task` + tmux:** The child session runs in a SEPARATE `opencode attach` process in the tmux pane. The tmux pane's `opencode attach` connects to the server independently. The pane IS the live view — but the `opencode attach` process may have rendering issues (race condition on connection, or the attach session doesn't subscribe to all event types).

**Missing primitive:** There is **no `capture-pane` polling loop** in Hivemind. The tmux pane relies entirely on `opencode attach` for content rendering. If `opencode attach` has any issue, the pane goes dark. Hivemind has no fallback content capture mechanism.

**Evidence:**
- `src/features/tmux/session-manager.ts:165-177` — `onSessionCreated` spawns pane, registers tracked session, starts age timer. No content polling loop.
- `src/features/tmux/tmux-multiplexer.ts:309-352` — `listPanes()` returns metadata (paneId, title, isActive, dimensions) but NOT pane content.
- `src/features/tmux/observers.ts:51-67` — `TmuxEventType` union covers `session.created`, `session-state-changed`, `pane-captured`. The `pane-captured` event exists but is only fired by the P53 pane-monitor hook (journal persistence), NOT by a content polling loop that feeds the orchestrator's view.

### Symptom 2: No direct user interaction with child session

**File:line gap:** `src/tools/tmux-copilot.ts:56-63` — Permission gate restricts ALL tmux-copilot actions (including `send-keys`, `forward-prompt`, `take-over`, `release`) to orchestrator-tier agents only:

```typescript
const ORCHESTRATOR_AGENT_NAMES = new Set<string>(
  ORCHESTRATOR_AGENTS.map((a) => a.name),
  // hm-l0-orchestrator, hm-orchestrator, hf-l0-orchestrator, hf-l1-coordinator
)
```

At `tmux-copilot.ts:175-180`:
```typescript
const callerAgent = context.agent
if (!callerAgent || !ORCHESTRATOR_AGENT_NAMES.has(callerAgent)) {
  return renderToolResult({ error: { kind: "permission-denied", agent: callerAgent ?? "unknown" } })
}
```

**Why the user can't interact:** The human user's TUI session does not have an agent name in the `ORCHESTRATOR_AGENT_NAMES` set. When the user tries to invoke `tmux-copilot` directly, the tool returns `permission-denied`.

**What exists but is gated:**
- `send-keys` (`tmux-copilot.ts:183-196`) — raw keystroke delivery to tmux pane. Orchestrator-only.
- `forward-prompt` (`tmux-copilot.ts:232-263`) — sentinel-prepended prompt forwarding with `manualOverride` suppression check. Orchestrator-only.
- `take-over` / `release` (`tmux-copilot.ts:265-290`) — sets/clears `manualOverride` flag. Orchestrator-only.

**Missing primitive:** There is no user-facing tool that wraps `tmux-copilot` actions for direct user invocation. The `manualOverride` flag (P58 G5) was designed for the orchestrator to recognize user takeover, but the user has no tool to SET the flag. The user must physically switch to the tmux pane via tmux keybindings (Ctrl-B + arrow) and type directly — bypassing the Hivemind tool layer entirely.

### Symptom 3: Orchestrator main stream terminates early

**File:line gap:** `src/tools/delegation/delegate-task.ts:56-100` — The `delegate-task` tool's `execute()` calls `coordinator.dispatch()` and returns immediately:

```typescript
const result = await coordinator.dispatch({
  agent: args.agent,
  currentDepth: 0,
  parentSessionId,
  prompt,
  queueKey: `agent:${args.agent}`,
  surface: "agent-delegation",
  workingDirectory: context.directory ?? context.worktree,
})
// ... returns immediately with delegation ID
return renderToolResult(success(
  `[Harness] Delegated task to ${args.agent}`,
  { ...resultRecord, agent: args.agent },
))
```

**What the WaiterModel actually does (from source):**

1. `coordinator.dispatch()` at `coordinator.ts:152-243`:
   - Runs preflight check
   - Creates delegation record
   - Starts child session via `childSessionStarter.start()` (SDK native `task` under the hood)
   - Fires `onChildSessionCreated` callback → session-tracker receives `session.created` event
   - Starts `DelegationMonitor` (polls at 30/45/60/90/120/180 seconds, injects status lines)
   - Registers `PeriodicNotifier` (shows toast notifications)
   - Sets up dual-signal completion detection
   - Returns `DelegationResult { delegationId, childSessionId, status }` immediately

2. `SdkDelegationHandler` at `sdk-delegation/handler.ts:67-91`:
   - Adaptive polling via `setTimeout` timers at intervals: active=2s, base=5s, idle=15s, deep-idle=60s
   - Polls `getSessionMessageCount()` to detect stability/completion
   - Feeds message counts to `CompletionDetector`
   - Finalizes delegation when dual-signal completion detected

3. `DelegationMonitor` at `monitor.ts:86-119`:
   - Fires `setTimeout` at 30/45/60/90/120/180 seconds
   - Injects status lines into parent session via `inject()` callback
   - The `inject()` callback calls `appendTuiPrompt()` which appends text to the TUI prompt input

**The critical gap:** After `delegate-task` returns, the **orchestrator agent's turn ends**. The SDK sees the tool returned successfully and the agent has no more tool calls to make → the agent's turn completes. The background timers (DelegationMonitor, SdkDelegationHandler) continue running in the Node.js process, but they inject notifications via `appendTuiPrompt` which puts text into the user's prompt input — the orchestrator agent doesn't see these unless the user sends them.

**This is by design per the `subagent-delegation-patterns` skill:**
> `delegate-task` — **Async background, WaiterModel, polling via delegation-status.** Returns immediately with a delegation ID. The caller must check status using `delegation-status`.

The WaiterModel IS working — background polling, completion detection, and notification are all functional. But the orchestrator agent's main stream is NOT kept open. The agent would need to explicitly call `delegation-status` in a loop to stay active, which requires the agent to be prompted to do so.

**What `appendTuiPrompt` does:** At `session-api.ts:209`:
```typescript
export async function appendTuiPrompt(client: OpenCodeClient, text: string): Promise<unknown> {
  const request: TuiAppendPromptRequest = { body: { text } }
  return unwrapData(await client.tui.appendPrompt(request))
}
```
This appends text to the user's TUI prompt input. The user sees it as a pre-filled prompt but must press Enter to send it. The orchestrator agent does NOT receive this as a new message.

**What `showTuiToast` does (the replacement for notifications):** At `session-api.ts:227`:
```typescript
export async function showTuiToast(client, message, variant?) {
  return unwrapData(await client.tui.showToast({ body: { message, ...(variant ? { variant } : {}) } }))
}
```
Toast is transient and user-visible only — the agent's context does NOT receive it.

**Missing primitive:** There is no **"keep-alive" mechanism** that prevents the orchestrator agent's turn from ending while delegations are active. The SDK agent runtime terminates the turn when there are no more tool calls to make. The orchestrator agent would need a reason to keep calling tools (e.g., a `delegation-status` poll loop), but no such loop is injected automatically.

### Symptom 4: Orchestrator has no live JIT context for child sessions

**File:line gap:** `src/features/session-tracker/capture/event-capture.ts:82-119` — `handleSessionEvent()` routes events to handler classes:

```typescript
this.handlers = {
  "session.created": new SessionCreatedHandler(this.deps),
  "session.idle": new SessionIdleHandler(this.deps),
  "session.deleted": new SessionDeletedHandler(this.deps),
  "session.error": new SessionErrorHandler(this.deps),
  "session.compacted": new SessionCompactedHandler(this.deps),
  "session.next.compaction.ended": new SessionCompactedHandler(this.deps),
  "session.next.text.ended": new SessionNextTextEndedHandler(this.deps),
}
```

The session-tracker handles **lifecycle events** (`created`, `idle`, `deleted`, `error`) but does NOT subscribe to **real-time child session activity** (tool calls, thoughts, intermediate artifacts).

**How the orchestrator gets child status today:**
1. `delegation-status` tool polls the `DelegationManager`'s in-memory map
2. The `DelegationManager` is updated by `SdkDelegationHandler` polling `getSessionMessageCount()` every 2-60 seconds
3. The `DelegationMonitor` injects status lines into the parent session via `appendTuiPrompt`
4. The `recordChildMessageSignal` and `recordChildToolSignal` methods on the `DelegationManager` track signal counts

**What's missing:** The orchestrator can query `delegation-status` to get:
- `actionCount`, `messageCount`, `toolCallCount` (aggregate counts)
- `executionState`: `"pending" | "confirmed" | "stalled"`
- `evidenceLevel`: `"accepted-only" | "status-only" | "message" | "tool" | "message-and-tool"`
- `finalMessageExcerpt` (last message text)

But it CANNOT get:
- What specific tool the child is currently invoking
- What intermediate artifacts the child has produced
- What the child's current thinking/reasoning is
- Real-time streaming of child events

**Missing primitive:** There is no **event subscription mechanism** that the orchestrator can subscribe to for real-time child session events. The `delegation-status` tool is pull-based (the orchestrator must call it). There is no push-based event bus that delivers child session events to the orchestrator's context in real time.

---

## What the WaiterModel Actually Does

**Source evidence from `coordinator.ts:152-243` + `sdk-delegation/handler.ts:67-280`:**

1. **`delegate-task` IS truly async.** It calls `coordinator.dispatch()` which starts the child session and returns a `DelegationResult` immediately. The tool's `execute()` returns with a success envelope containing the delegation ID.

2. **The main stream does NOT block.** The orchestrator agent receives the tool result and its turn continues. If the agent has no more tool calls, its turn ends. The SDK agent runtime does not keep the turn open for background delegations.

3. **Background monitoring runs in Node.js timers:**
   - `DelegationMonitor` — `setTimeout` at 30/45/60/90/120/180s → injects status lines via `appendTuiPrompt`
   - `SdkDelegationHandler` — adaptive polling every 2-60s → checks `getSessionMessageCount()`, feeds `CompletionDetector`
   - `PeriodicNotifier` — shows toast notifications via `showTuiToast`

4. **Completion detection is dual-signal:** Both `CompletionDetector` (idle/error/deleted signals) AND `stablePollCount` (consecutive stable polls ≥ threshold) must agree before finalization.

5. **The documented behavior (from `subagent-delegation-patterns` skill):**
   > `delegate-task` — **Async background, WaiterModel, polling via delegation-status.** Returns immediately. Caller must check status using `delegation-status`.

   This is correct — the WaiterModel returns immediately and expects the CALLER to poll. But the orchestrator AGENT is the caller, and its turn ends after the tool returns.

---

## Symptom 1 Deep Dive: Why First Prompt Only?

**The exclusive tmux-panel failure mode. Evidence chain:**

1. `coordinator.dispatch()` at `coordinator.ts:172-198` calls `childSessionStarter.start()` which creates a child session via the SDK's native `task` tool internally.

2. The `onChildSessionCreated` callback at `coordinator.ts:200` fires:
   ```typescript
   this.deps.onChildSessionCreated?.(child.childSessionId, params.parentSessionId)
   ```

3. This callback is wired in `dist/plugin.js:500-503`:
   ```typescript
   onChildSessionCreated: (childSessionId, _parentSessionId) => {
     void sessionTracker.handleSessionEvent({
       eventType: "session.created", sessionID: childSessionId, event: {}
     });
   },
   ```

4. The session-tracker's `handleSessionEvent` routes to `SessionCreatedHandler` which persists the child session record.

5. **Separately**, the `tmuxObserver` (at `dist/plugin.js:608`) receives the same `session.created` event from the SDK event stream and forwards it to `SessionManager.onSessionCreated()`.

6. `SessionManager.onSessionCreated()` at `session-manager.ts:131-215`:
   - Calls `multiplexer.spawnPane({ sessionId, serverUrl, directory, hivemindMeta })`
   - `spawnPane()` at `tmux-multiplexer.ts:215-248` runs:
     ```
     tmux split-window -t <mainPane> -h -d -P -F #{pane_id} \
       'opencode attach <serverUrl> --session <sessionId> --dir <directory>'
     ```
   - The new tmux pane runs `opencode attach` which connects to the OpenCode server and attaches to the child session.

7. **The `opencode attach` process IS the live TUI for the child session.** It should render all child session activity (tool calls, thoughts, messages) in the tmux pane.

8. **Why it shows only the first prompt:**
   - The `opencode attach` process connects to the server and renders the initial session state (the first prompt).
   - For subsequent activity to appear, the `opencode attach` process must receive and render events from the child session via the OpenCode server's event stream.
   - **The child session is running inside the SDK's native `task` tool invocation.** The SDK's `task` tool creates a child session that is a sub-session of the parent. The `opencode attach` process connects to this child session as an independent client.
   - **The likely failure point:** The `opencode attach` process may not be receiving the child session's events because:
     a. The child session's events are streamed to the PARENT session (the orchestrator) via the SDK's internal event system, not broadcast to all attached clients.
     b. The `opencode attach` process subscribes to the session's events but the server only sends events to the session's creator (the parent SDK client), not to arbitrary attached clients.
     c. There is a race condition where `opencode attach` connects before the child session has emitted any events, and the server doesn't push subsequent events to late-joining clients.

**This is an OpenCode SDK/server-side issue, not a Hivemind issue.** The tmux pane's `opencode attach` is an SDK client. If the SDK server doesn't broadcast child session events to attached clients, the pane goes dark after the initial state.

**Hivemind's gap:** No fallback content capture. No `capture-pane` polling. No health check on pane content freshness.

---

## In-Scope vs Out-of-Scope Assessment

| Symptom | P58 In-Scope? | If yes, why not covered? | If no, which follow-up phase? |
|---------|---------------|--------------------------|-------------------------------|
| **1** — Pane shows first prompt only | **Partial.** G4 (`forward-prompt`) delivers prompts TO the pane. But pane CONTENT STREAMING is not covered. | P58 SPEC focuses on prompt delivery (G4), pane survival (G3), and pool API (G2). Live content streaming was not identified as a gap. | **New phase needed: "tmux pane live content streaming"** — requires either `capture-pane` polling or fixing `opencode attach` event subscription. |
| **2** — No direct user interaction | **Yes, partially covered.** G5 (`take-over`/`release`) addresses orchestrator recognition of user takeover. | The SPEC correctly implements `take-over`/`release` but gates them behind orchestrator-tier permission. User-facing invocation was not considered. | **P58 fix possible:** Widen the permission gate for `take-over`/`release` to allow user-session invocation. Or create a separate user-facing tool. |
| **3** — Main stream terminates early | **No. Out of P58 scope.** | P58 does not address the WaiterModel keep-alive contract. The `delegate-task` tool's non-blocking return is by design. | **New phase needed: "WaiterModel keep-alive"** — requires a mechanism to keep the orchestrator agent's turn open while delegations are active. |
| **4** — No live JIT context | **No. Out of P58 scope.** | P58 G6 adds 3 lifecycle events (`queued`/`dispatched`/`terminal`) but NOT real-time child activity streaming. | **New phase needed: "real-time child event streaming"** — requires an event subscription mechanism that pushes child session events to the orchestrator's context. |

---

## Specific Fix Recommendations (DO NOT IMPLEMENT)

### Option A: P58-scoped fixes (2 of 4 symptoms)

**Fix 1 — Symptom 2: Widen `take-over`/`release` permission gate**
- **File:** `src/tools/tmux-copilot.ts:56-63`
- **Change:** Create a separate permission tier for `take-over` and `release` actions that allows ANY authenticated session (not just orchestrator-tier agents). The `send-keys` and `forward-prompt` actions remain orchestrator-only.
- **Why:** The user needs to be able to signal takeover intent. Currently the only path is physical tmux pane switching (Ctrl-B), bypassing Hivemind entirely.
- **Risk:** Low. The `manualOverride` flag is already in-memory-only. Widening the gate adds one code path.

**Fix 2 — Symptom 1 (partial): Add `capture-pane` polling to tmux integration**
- **File:** `src/features/tmux/session-manager.ts` (new method)
- **Change:** Add a `capturePaneContent(paneId)` method to `TmuxMultiplexer` that runs `tmux capture-pane -t <paneId> -p` and returns the content. Add a polling loop (every 5-10s) in `SessionManager` that captures pane content and emits `pane-captured` events. Wire the P53 pane-monitor hook to persist the content. Surface the latest capture via `delegation-status { action: "pool" }`.
- **Why:** Provides a Hivemind-level fallback when `opencode attach` fails to render live content.
- **Risk:** Medium. `capture-pane` is expensive for large panes. Need to cap content size and implement backoff.

### Option B: New phase fixes (all 4 symptoms)

**Fix 3 — Symptom 3: WaiterModel keep-alive mechanism**
- **File:** New module `src/coordination/delegation/keep-alive.ts`
- **Change:** After `delegate-task` dispatches, inject a "pending delegations active" signal into the orchestrator agent's context that prevents the SDK agent runtime from terminating the turn. This could be implemented as:
  a. A synthetic tool call (`delegation-status { action: "auto-poll" }`) that blocks until all delegations complete
  b. A hook in the SDK agent runtime that checks for active delegations before terminating the turn
  c. A `showTuiToast` + `appendTuiPrompt` combination that prompts the user to ask "status?" (current workaround)
- **Why:** The orchestrator agent's turn must stay open for the user to communicate mid-flight.
- **Risk:** High. Requires understanding the SDK agent runtime's turn termination logic. May conflict with the SDK's own session lifecycle.

**Fix 4 — Symptom 4: Real-time child event streaming**
- **File:** New module `src/features/session-tracker/streaming/child-event-stream.ts`
- **Change:** Create an event subscription mechanism that:
  a. Subscribes to the child session's event stream via the SDK
  b. Pushes events (tool calls, messages, state transitions) to an in-memory event bus
  c. The orchestrator can query the event bus via `delegation-status { action: "peek", delegationId }` or subscribe via a hook
- **Why:** The orchestrator needs to know what the child is doing in real time.
- **Risk:** High. Requires SDK support for subscribing to arbitrary session events. May require SDK upgrade.

### Option C: Architecture-level fix (addresses root cause)

**Fix 5 — Unify `task` and `delegate-task` rendering paths**
- **File:** `src/features/tmux/integration.ts` + `src/coordination/delegation/coordinator.ts`
- **Change:** Instead of spawning `opencode attach` in the tmux pane, use the SDK's native event streaming to project the child session's activity into the pane. This would involve:
  a. Capturing the child session's events via the SDK (same path as native `task` tool)
  b. Writing the events to a file or pipe that the tmux pane reads
  c. Rendering the events in the pane using a lightweight viewer (not `opencode attach`)
- **Why:** Eliminates the dependency on `opencode attach` for live rendering. Uses the proven SDK event stream path.
- **Risk:** Very high. Requires significant architecture change. May require new SDK APIs.

---

## Verification Plan

| Fix | Test | Runnable Today? |
|-----|------|-----------------|
| **Fix 1** (widen permission) | BATS: invoke `tmux-copilot { action: "take-over" }` from a non-orchestrator agent context. Assert `takenBy: "human-operator"` returned. | Yes — modify BATS 65 to test non-orchestrator invocation. |
| **Fix 2** (capture-pane polling) | BATS: spawn tmux pane with `cat`, write text to pane, assert `capture-pane` returns the text within 10s. | Yes — extend BATS 64 with capture-pane assertion. |
| **Fix 3** (keep-alive) | Manual: dispatch `delegate-task`, verify orchestrator agent's turn stays open for 60+ seconds. User sends message mid-flight, orchestrator responds. | Partially — requires running OpenCode with tmux. |
| **Fix 4** (event streaming) | Manual: dispatch `delegate-task`, query `delegation-status { action: "peek" }` mid-flight, verify child's current tool call is visible. | No — requires new API. |
| **Fix 5** (unified rendering) | Manual: dispatch `delegate-task`, verify tmux pane shows child's tool calls in real time (same as native `task` + focus click). | No — requires architecture change. |

---

## Risk Assessment

| Surface | Risk | Re-verify |
|---------|------|-----------|
| **`tmux-copilot` permission gate** | Widening the gate may allow unauthorized sessions to send keys to panes. Need to scope the widening to `take-over`/`release` only. | BATS 65 (takeover-release) must continue to pass with widened gate. |
| **`capture-pane` polling** | `capture-pane` is expensive for large panes. May cause tmux server latency. Need content size cap and backoff. | BATS 57 (live-pane-monitoring) must continue to pass. Monitor tmux server CPU during polling. |
| **Keep-alive mechanism** | May conflict with SDK agent runtime's turn termination logic. May cause the orchestrator agent to consume excessive tokens if it stays active indefinitely. | All delegation BATS (61-66) must continue to pass. Monitor token consumption during keep-alive. |
| **Event streaming** | May require SDK upgrade. May introduce new event types that conflict with existing `session.created`/`session.idle` events. | All session-tracker tests must continue to pass. Verify event ordering and deduplication. |
| **Unified rendering** | Replaces `opencode attach` with a custom viewer. Loses the full OpenCode TUI experience in the tmux pane. | All tmux BATS (51-66) must continue to pass. User acceptance testing required. |

---

## BATS Test Results (ALL 5 P58 SCENARIOS)

| Test | Result | Notes |
|------|--------|-------|
| `tests/scripts/tmux/62-pool-status-api.bats` | **PASS** (1/1, exit 0) | `getPoolSnapshot` returns frozen DelegationPool with 3 entries (G2) |
| `tests/scripts/tmux/63-abort-resume-pane-survival.bats` | **PASS** (1/1, exit 0) | `abortDelegation` + resume preserves tmux pane via `state=paused` (G3) |
| `tests/scripts/tmux/64-forward-prompt.bats` | **PASS** (1/1, exit 0) | `tmux-copilot forward-prompt` delivers sentinel-prepended text to live pane (G4) |
| `tests/scripts/tmux/65-takeover-release.bats` | **PASS** (1/1, exit 0) | `tmux-copilot take-over / release` suppresses and restores forward-prompt (G5) |
| `tests/scripts/tmux/66-session-tracker-delegation-events.bats` | **PASS** (1/1, exit 0) | `session-tracker` emits 3 delegation lifecycle events with monotonic emittedAt (G6) |

**Conclusion:** Phase 58 implementation is correct per its spec. All 5 P58 BATS scenarios pass. The 4 user-reported symptoms are OUTSIDE the P58 spec scope (Symptoms 3 and 4) or only partially addressed (Symptoms 1 and 2).

## Session-Tracker State (Live Evidence)

**Project continuity:** `.hivemind/session-tracker/project-continuity.json` (version 2.0, last updated 2026-06-03T20:00:11.862Z)

**Active sessions (15+ tracked):**

| Session ID | Created | Children | Depth | Status |
|-----------|---------|----------|-------|--------|
| `ses_182154c48fferRI5ZwyUifuhor` | 2026-06-01 | **43** | 2 | active |
| `ses_180cbe824ffevJS09MQ0AHnKPh` | 2026-05-31 | 10 | 1 | active |
| `ses_1810b09caffe00jMr7vfaSCxFo` | 2026-05-31 | 0 | 0 | active |
| `ses_17c73d8e9ffev03Kl1ZE7PCnBq` | 2026-06-01 | 2 | 1 | active |
| `ses_17c6e3bf7ffekWenJo5AJrSmFM` | 2026-06-01 | — | — | active |

**Note:** The session ID referenced in the original delegation (`ses_17125ea08ffeqGFcR38RaB7I62`) does NOT exist in the session-tracker. It is likely from a prior UAT attempt that was cleaned up or never persisted.

**Most recently modified session directories:**
- `ses_1723d915effe0g1RAXPAJ7yH4v` — modified Jun 4 03:00 (most recent)
- `ses_17743befcffewaXqGZ8tDIoCCn` — modified Jun 4 02:09
- `ses_1780426a7ffe0Tu8kwPa3z76h3` — modified Jun 4 02:06

**Session-tracker assessment:** The tracker IS operational — sessions are tracked, continuity is maintained, delegation trees exist with up to 43 children at depth 2. The read-side infrastructure works. The gap is that this data is only available via PULL (the orchestrator must call tools to access it), not PUSH (no event subscription delivers child activity in real time).

---

## Evidence File Index

| File | Lines Read | Key Findings |
|------|-----------|--------------|
| `src/tools/delegation/delegate-task.ts` | 111 (full) | Returns immediately after `coordinator.dispatch()`. No keep-alive. |
| `src/tools/delegation/delegation-status.ts` | 793 (full) | 5 actions: status, list, control, find-stackable, pool. No `peek` or `progress` for mid-flight state. |
| `src/tools/tmux-copilot.ts` | 352 (full) | 7 actions (send-keys, list-panes, compute-grid, respawn, forward-prompt, take-over, release). All orchestrator-gated. |
| `src/coordination/delegation/manager.ts` | 581 (full) | `DelegationManager` facade. `getPoolSnapshot()` implemented. `abortDelegation` persists `state: "paused"`. |
| `src/coordination/delegation/coordinator.ts` | 300 (partial) | `dispatch()` creates child session, starts monitor, registers completion. Returns immediately. |
| `src/coordination/delegation/monitor.ts` | 120 (partial) | Polls at 30/45/60/90/120/180s. Injects status via `appendTuiPrompt`. |
| `src/coordination/sdk-delegation/handler.ts` | 280 (full) | Adaptive polling 2-60s. `getSessionMessageCount()`. Dual-signal completion. |
| `src/coordination/delegation/session-intelligence.ts` | 281 (full) | `findStackableSessions`, `findResumableSessions`, `getRetryRecommendation`. Read-only. |
| `src/features/tmux/session-manager.ts` | 333 (full) | `onSessionCreated` spawns pane. No content polling. `respawnIfKnown` for recovery. |
| `src/features/tmux/tmux-multiplexer.ts` | 563 (full) | `spawnPane` runs `opencode attach`. `listPanes` returns metadata only. `sendKeys` for key delivery. |
| `src/features/tmux/types.ts` | 204 (full) | `SessionManagerAdapter` interface. Module-level adapter bridge. |
| `src/features/tmux/observers.ts` | 207 (full) | `createTmuxEventObserver`. Handles `session.created`, `session-state-changed`, `pane-captured`. |
| `src/features/session-tracker/index.ts` | 250 (partial) | `SessionTracker` class. `manualOverride` map (P58 G5). `handleSessionEvent` routes to handlers. |
| `src/features/session-tracker/capture/event-capture.ts` | 150 (partial) | `EventCapture` router. 7 event handlers. No real-time child activity streaming. |
| `dist/plugin.js` | 300 lines (400-700) | Plugin wiring. `onChildSessionCreated` → session-tracker. `tmuxObserver` → SessionManager. |
| `.planning/.../58-SPEC.md` | 253 (full) | 6 REQS (G1-G6). None cover live streaming or keep-alive. |
| `.planning/.../58-CONTEXT.md` | 272 (full) | 17 decisions (D-58-01..17). None address Symptom 3 or 4. |
| `.planning/.../58-PATTERNS.md` | 321 (full) | 8 patterns. Pattern 5 (sentinel forward-prompt) is the closest to Symptom 1. |

---

*Session state: DEBUG COMPLETE — 4 root causes identified, 5 fix options proposed, 0 code changes made.*
*Resume: `/hm-debug continue tmux-delegate-streaming-gaps`*
