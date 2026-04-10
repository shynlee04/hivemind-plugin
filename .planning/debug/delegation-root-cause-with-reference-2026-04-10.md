# Root Cause Analysis: Persistent Background Delegation Failure

**Date:** 2026-04-10  
**Reference:** oh-my-openagent (code-yeongyu/oh-my-openagent)  
**Analyst:** GSD Debug Agent (diagnose_only mode)  

---

## Executive Summary

The persistent background delegation failure is **not a single bug** but a **multi-layered architectural mismatch** between how the harness delegates work and how oh-my-openagent does it. The harness attempts to solve the same problem (async child session delegation + completion detection + parent observability) using fundamentally different primitives — and those primitives are insufficient for the task.

### The Core Difference (One Sentence)

**oh-my-openagent** manages background tasks via a **`BackgroundManager`** that owns an explicit task lifecycle (`pending → running → completed/error`) with **message-count stability detection** (3+ consecutive polls showing unchanged message count = done). The harness uses a **poll-based session status observer** that checks OpenCode's coarse `idle | busy | retry` status — a model that cannot distinguish "not yet started" from "finished working."

---

## 1. How oh-my-openagent handles background execution

### 1.1 The BackgroundManager Architecture

oh-my-openagent's `BackgroundManager` is a **task lifecycle manager**, not just a session poller:

```
Task created → pending (waiting for concurrency slot)
           → running (acquired slot, session dispatched)
           → completed (idle + message-count stable for N polls)
           → error (session deleted/gone + no valid output)
```

Key components:
- **`pollRunningTasks()`** — iterates all running tasks every `pollingInterval` (~3 seconds)
- **`isActiveSessionStatus()` / `isTerminalSessionStatus()`** — classifies session status
- **Stability detection** — message count unchanged for 3+ consecutive polls (~10 seconds)
- **`tryCompleteTask()`** — atomic state transition: sets `status: "completed"`, records `completedAt`
- **`queuesByKey`** — tracks pending tasks; `processingKeys` — tracks running tasks

### 1.2 Completion Detection: Two-Signal Requirement

oh-my-openagent requires **BOTH** conditions before marking complete:
1. Session status is `idle` (or session is gone from status map)
2. **Message count has been stable for N consecutive polls** (default: 3 polls × 3s = ~10s)

This is the critical difference. The harness's observer only checks condition #1.

### 1.3 "Not Yet Started" vs "Completed" Distinction

oh-my-openagent distinguishes these via **explicit task state tracking**:
- A task is `pending` when waiting for a concurrency slot
- A task is `running` when dispatched and processing
- A task only transitions to `completed` after the **stability gate** passes
- If a session is "gone" from the status map, it checks: has `MIN_SESSION_GONE_POLLS` passed? Is there valid output? Only then marks error.

### 1.4 Tmux/OpenClaw Style Execution

oh-my-openagent offers a second execution mode via `TmuxSessionManager`:
- Spawns agents in actual tmux panes using `opencode attach -s <session-id>`
- **The tmux pane IS the completion detector** — when the process exits, the pane is closed
- Uses `TmuxPollingManager` to detect finished sessions and close panes
- More reliable because: process exit is a **binary, unambiguous signal** (vs. polling `idle` status)

The tmux path is **visually observable** — the user can watch agents work in real-time.

---

## 2. How the harness handles background execution

### 2.1 The Delegation Pipeline

```
delegate-task tool
  → classifyExecutionMode() → execution family + submode
  → lifecycleManager.launchDelegatedSession()
    → createSession() (child OpenCode session)
    → recordSessionContinuity() (durable JSON)
    → acquireLifecycleQueue() (concurrency control)
    → If runInBackground:
      → sendPromptAsync() (fire-and-forget, returns 204)
      → observeBackgroundCompletion() (poll-based observer)
      → return JSON response immediately
```

### 2.2 The Observer (`lifecycle-background-observer.ts`)

**Current state of the observer** (as of this codebase):

The observer DOES have `seenBusy` tracking and `startupWindowElapsed` checks:

```typescript
let seenBusy = false

// In the poll loop:
if (statusType === "busy") {
  seenBusy = true
}

const startupWindowElapsed =
  typeof launchedAt === "number" && Number.isFinite(launchedAt)
    ? args.now() - launchedAt >= pollIntervalMs
    : false

if (statusType === "idle") {
  if (!seenBusy && !startupWindowElapsed) {
    await doSleep(pollIntervalMs)
    continue  // Wait for the session to actually start
  }
  // Only now treat idle as completion
}
```

**This is a fix that was already applied** (from the prior debug sessions). However, it has **residual weaknesses**:

### 2.3 Residual Weaknesses in the Current Observer

1. **`startupWindowElapsed` is a time gate, not a proof of execution**: It checks if `pollIntervalMs` (15 seconds) has passed since `launchedAt`. But `launchedAt` is set just before `promptAsync()` is called — the 15-second window may not be enough for the OpenCode platform to actually start the agent. The agent might still be in "queued" state after 15 seconds.

2. **No message-count verification**: Unlike oh-my-openagent, the harness never checks if the child session's message count has grown. A session could sit in "busy" for 15 seconds (setting `seenBusy = true`), then go "idle" without ever having processed the prompt. The observer would mark it complete.

3. **Poll interval is 15 seconds**: oh-my-openagent polls every ~3 seconds. The harness polls every 15 seconds. This means the observer is 5× less responsive and more likely to miss transient state changes.

4. **`checkSessionExists()` uses `client.session.get()`, not status map**: This is MORE reliable for existence checking, but the status extraction logic is fragile:
   ```typescript
   const raw = session as Record<string, unknown>
   const status = raw.status ?? raw.info
   ```
   If the API response shape changes, this silently breaks.

---

## 3. The Root Causes — Ranked

### Root Cause #1: OpenCode's Session Status Model is Fundamentally Insufficient

**Severity:** CRITICAL  
**Type:** Platform-level design constraint

OpenCode's session status model (`idle | busy | retry`) has **no semantic distinction** between:
- "idle because I just created the session and haven't started the agent yet"
- "idle because the agent finished all its work"
- "idle because the agent is waiting for a tool response"
- "idle because the session crashed and recovered"

oh-my-openagent works around this by adding a **second signal** (message count stability). The harness attempted to work around it with `seenBusy` + `startupWindowElapsed`, but these are **weaker signals**:

| Signal | oh-my-openagent | Harness |
|--------|----------------|---------|
| Session status | ✅ idle/busy/retry | ✅ idle/busy/retry |
| Message count stability | ✅ 3+ consecutive polls show no change | ❌ Not checked |
| Seen busy transition | ✅ Implicit (task is "running" before "idle") | ✅ `seenBusy` flag |
| Startup grace period | ✅ Implicit (task must be "running" first) | ⚠️ `startupWindowElapsed` (time-based, not state-based) |
| Output verification | ✅ Checks for valid output before completing | ❌ None |

**The harness's observer can be correct IF**: the session always transitions `idle → busy → idle` with no gaps. But if OpenCode's agent startup is slow (e.g., model loading, context warming), the session might go `idle → (15s poll) → still idle → marked complete` before ever hitting "busy."

### Root Cause #2: The `builtin-process` vs `builtin-subsession` Duality is a Diagnostic Trap

**Severity:** HIGH  
**Type:** Architectural confusion

The `classifyExecutionMode()` classifier can return either `builtin-process` (Node.js child process) or `builtin-subsession` (OpenCode child session). The `launchDelegatedSession()` dispatches to the correct runner based on `execution.submode`.

**However**, the classifier's decision logic is:
- `isResearch: true` → `builtin-process` (uses `backgroundManager.spawn()`)
- `isInteractive: true` → `builtin-subsession` (uses OpenCode sessions)

The `builtin-process` path actually **works correctly** because it uses OS process exit as the completion signal — a binary, unambiguous event. The `builtin-subsession` path is the one that suffers from the idle≠completed bug.

**The diagnostic trap**: When debugging, you might be looking at `builtin-process` execution (which works) while the actual failure is in `builtin-subsession` execution. The two paths share the same tool (`delegate-task`) but have completely different reliability characteristics.

### Root Cause #3: Parent Observability is Best-Effort, Not Guaranteed

**Severity:** HIGH  
**Type:** Delivery contract gap

The notification pipeline:
1. `notifyParentSession()` → calls `client.session.prompt()` on parent (best-effort)
2. If delivery fails → `persistPendingNotification()` → writes to disk
3. **Missing link**: No runtime code reads persisted notifications and delivers them to resumed parent sessions

The `persistPendingNotification()` function has a critical dependency: it requires the parent to already have a continuity record. `ensureParentContinuityRecord()` in the lifecycle manager creates this, but only for parents that have delegated children. A parent session created independently has no continuity record, so pending notifications are silently dropped.

### Root Cause #4: Sync Mode (`run_in_background: false`) Crashes the JSON Parser

**Severity:** CRITICAL  
**Type:** Output format defect

When `run_in_background: false`, `runLifecycleSubsessionTask()` awaits `sendPrompt()` and returns the assistant text directly. This large text response appears to exceed OpenCode's tool output buffer or contain characters that break the JSON parser. The `Unexpected EOF` error suggests the response is truncated.

oh-my-openagent avoids this by using `hashline_edit` for code changes (structured, line-anchored edits) rather than returning large text blobs.

### Root Cause #5: The `background` Tool Naming Collision

**Severity:** MEDIUM  
**Type:** UX/terminology defect

The `delegate-task` tool's `run_in_background` parameter and the separate `background` tool (OS subprocess management) share the word "background" but manage completely different systems. The tool description attempts to clarify ("This is separate from the background tool for OS child processes") but the LLM still confuses them.

oh-my-openagent avoids this by naming its tool `background_task` (for OS processes) and having delegation be implicit through the `delegate_task` tool — no `run_in_background` parameter.

---

## 4. Architectural Comparison: oh-my-openagent vs Harness

| Aspect | oh-my-openagent | Harness | Winner |
|--------|----------------|---------|--------|
| **Task lifecycle** | Explicit state machine (`pending→running→completed/error`) | Implicit (derived from session status) | OMO |
| **Completion signal** | idle + message-count stability (3+ polls) | idle + seenBusy + startupWindowElapsed | OMO (stronger signal) |
| **Poll interval** | ~3 seconds | 15 seconds | OMO |
| **Tmux integration** | Full `TmuxSessionManager` with pane management | None | OMO |
| **Parent notification** | Toast + session prompt | Toast + session prompt + pending persistence (partially wired) | Tie |
| **Sync mode** | Uses `hashline_edit` for structured output | Returns raw assistant text (crashes parser) | OMO |
| **Background naming** | `background_task` (OS) vs `delegate_task` (session) — clear separation | `run_in_background` (bool) + `background` tool — confusing overlap | OMO |
| **Execution mode routing** | Implicit (all delegation goes through same path, tmux is additive) | Explicit classifier (`builtin-process` vs `builtin-subsession`) — creates diagnostic trap | Harness (in theory), but OMO in practice |

---

## 5. Why oh-my-openagent Works and the Harness Doesn't

### The Fundamental Difference

oh-my-openagent treats background delegation as a **task management problem** with a state machine, explicit lifecycle, and multi-signal completion detection.

The harness treats background delegation as a **session observation problem** — it polls session status and tries to infer completion from an ambiguous signal.

### The Critical Missing Piece

The harness has **no message-count verification**. oh-my-openagent's stability gate (3+ consecutive polls showing unchanged message count) is the single most important difference. Without it:

- A session that goes `idle → busy (14s) → idle` would be detected correctly by both
- A session that goes `idle → idle → idle` (never actually started) would be detected as "completed" by the harness but not by oh-my-openagent (because message count never grew)

### The Tmux Advantage

oh-my-openagent's tmux integration provides a **fallback completion signal** that is completely independent of session status polling. When the tmux pane's process exits, the session is done — no ambiguity. The harness has no equivalent.

---

## 6. Required Architectural Changes

### Priority 1: Add Message-Count Stability Detection (Tactical)

In `observeBackgroundCompletion()`, after detecting `idle` status:
1. Poll `client.session.messages(sessionID)` to get current message count
2. If count hasn't changed from previous poll, increment stability counter
3. Only mark "completed" when stability counter reaches 3
4. Reset stability counter if message count changes

This is the minimum fix to bring the harness to parity with oh-my-openagent's completion detection.

### Priority 2: Wire Up Parent Notification Replay (Tactical)

The `formatPendingNotificationsForSession()` function exists but is never called. It needs to be invoked:
- When a parent session resumes (via `handleEvent` or session creation hook)
- When the parent session's continuity record is loaded (via `hydrateFromContinuity`)

### Priority 3: Remove or Fix Sync Mode (Tactical)

Option A: Remove `run_in_background: false` entirely — always use async
Option B: Wrap the response in a structured format that's guaranteed to be valid JSON (e.g., `{"output": "<base64-encoded text>"}`)

### Priority 4: Rename `run_in_background` to Avoid Collision (UX)

Change the parameter name from `run_in_background` to something like `async_dispatch` or `non_blocking` to distinguish it from the `background` tool.

### Priority 5: Consider Tmux Integration (Strategic)

If tmux is available, the harness could optionally spawn delegated sessions in tmux panes (like oh-my-openagent does). This would provide:
- Visual observability (user can watch agents work)
- Reliable completion detection (process exit)
- Isolation from parent session lifecycle

---

## 7. Summary Table of All Root Causes

| # | Root Cause | Category | Impact | oh-my-openagent has it? |
|---|-----------|----------|--------|------------------------|
| 1 | OpenCode status model insufficient for completion detection | Platform constraint | False-success completions | ✅ Worked around with message-count stability |
| 2 | `builtin-process` vs `builtin-subsession` diagnostic trap | Architectural confusion | Wrong debugging path | ❌ No equivalent duality |
| 3 | Parent notification delivery not durable | Delivery contract gap | Lost notifications on parent resume | ❌ Also best-effort, but no persistence layer to maintain |
| 4 | Sync mode crashes JSON parser | Output format defect | Sync delegation unusable | ✅ Uses `hashline_edit` |
| 5 | `background` naming collision | UX/terminology | LLM confusion | ✅ Clear separation |
| 6 | No message-count stability gate | Completion detection weakness | False-positive completions | ✅ Core to completion logic |
| 7 | Poll interval too long (15s vs 3s) | Responsiveness | Slower detection, higher miss rate | ✅ Polls every ~3s |
| 8 | No tmux integration | Missing fallback | No reliable completion signal | ✅ Full `TmuxSessionManager` |

---

## 8. Conclusion

The persistent background delegation failure is caused by **Root Cause #1** (insufficient completion signal) amplified by **Root Cause #6** (no message-count stability). The harness's observer correctly tracks `seenBusy` and `startupWindowElapsed`, but these are **necessary but insufficient** conditions for detecting actual completion.

oh-my-openagent succeeds because it adds a **second independent signal** (message count stability) that the harness lacks. The fix is not to change the polling infrastructure but to add message-count verification as a completion gate.

The remaining root causes (#2-#8) are contributing factors that make the problem harder to diagnose and fix, but they are not the primary cause of the instant false-success behavior observed in the reported sessions.
