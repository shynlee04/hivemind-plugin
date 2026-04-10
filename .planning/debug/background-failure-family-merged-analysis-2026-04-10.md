# Merged Root Cause Analysis: Background Delegation Failure Family

**Date:** 2026-04-10
**Sessions:** `session-ses_28b9+WTF_WRONG.md`, `session-ses_28bd_json_parser_error.md`, `session-ses_28bd_unknown_error.md`
**Analyst:** Orchestrator investigation (merged from two independent debug traces)

---

## Executive Summary

The reported failure family is **not one bug** — it is a layered design mismatch across 4 severity levels, from architectural to mechanical. The codebase advertises multiple background execution modes, but live delegation always executes through one path (child-session async). That path has a state machine flaw that reports false-success in milliseconds. Parent observability is structurally incomplete. And the terminology confuses operators and agents alike.

---

## Root Cause Hierarchy (Ranked by Severity)

### RC-1: Architectural Lie — Runtime Selection ≠ Runtime Execution

**Severity:** CRITICAL — poisons every diagnosis, test, and operator expectation

**What the codebase says exists:**
- `builtin-process` — OS subprocess execution (classifier-selected for research/headless tasks)
- `builtin-subsession` — OpenCode child-session async execution
- `background` tool — standalone OS process manager

**What actually runs:**
- ALL delegation goes through `builtin-subsession` (child-session async)
- `resolveEffectiveExecutionMode()` at `lifecycle-manager.ts:59` silently rewrites `builtin-process` → `builtin-subsession`
- `launchDelegatedSession()` at line 363 always calls `runLifecycleSubsessionTask()` — never calls `runLifecycleProcessTask()`
- Route metadata says `family: "builtin-process"` but reality is `builtin-subsession`

**Why this matters:**
- Tests assert research/headless resolves to `builtin-process` (execution-mode.test.ts:102)
- Tests then assert that same choice is rewritten to `builtin-subsession` (background-manager-harden.test.ts:317)
- Users/debuggers think they're debugging process-backed work but are actually debugging session-backed polling
- The classifier, router, and tests all describe a world that doesn't exist at runtime

**Evidence chain:**
- `src/tools/delegate-task.ts:128` — `buildTaskCharacteristics()` marks research as `isResearch: true`, `isHeadless: true`
- `src/lib/execution-mode.ts:158` — `classifyExecutionMode()` selects `builtin-process` for research
- `src/lib/lifecycle-manager.ts:59-71` — `resolveEffectiveExecutionMode()` rewrites to `builtin-subsession`
- `src/lib/lifecycle-manager.ts:363` — `launchDelegatedSession()` always calls `runLifecycleSubsessionTask()`
- `src/lib/lifecycle-process-runner.ts:149` — `runLifecycleProcessTask()` exists but has no live caller

---

### RC-2: Mechanical Bug — Observer Conflates "idle" with "completed"

**Severity:** CRITICAL — causes instant false-success with zero work performed

**The failure chain:**
```
sendPromptAsync() → 204 (prompt QUEUED, agent NOT started)
         ↓
observeBackgroundCompletion() enters while loop — NO initial sleep
         ↓
FIRST POLL (0ms): checkSessionExists() → status: "idle"
         ↓
"idle" → "COMPLETED!" ← THE BUG (no seenBusy tracking)
         ↓
patchLifecycle(status:"completed", phase:"completed", completedAt:now())
         ↓
buildTaskNotificationFromContinuity() → "Builder completed work on..."
         ↓
notifyParentSession() → parent receives legitimate-looking completion
         ↓
Result: 15ms "completion", zero artifacts, full metadata, ok:true
```

**The state machine problem:**

OpenCode's session status is 3-state: `idle | busy | retry`

| Status | What it means | What observer thinks |
|--------|---------------|---------------------|
| `idle` | Not currently processing | "COMPLETED!" ← WRONG if never saw busy |
| `busy` | Actively working | "still running" ← correct |
| `retry` | Error + retrying | "FAILED" ← correct |

The observer has NO `seenBusy` flag. Without it, there is no way to distinguish:
- "idle because work finished" ✅
- "idle because work never started" ❌

**Correct state machine:**
```
Created → "idle" (not started)
sendPromptAsync() → dispatch
Observer checks → "idle", seenBusy=false → sleep (NOT completed)
... agent starts ...
Observer checks → "busy" → seenBusy=true → sleep
... agent finishes ...
Observer checks → "idle" AND seenBusy=true → "COMPLETED" ✓
```

**Evidence chain:**
- `src/lib/lifecycle-background-observer.ts:92` — while loop starts, no initial sleep
- `src/lib/lifecycle-background-observer.ts:130` — `if (statusType === "idle")` → marks completed
- `src/lib/lifecycle-process-runner.ts:348` — `observeBackgroundCompletion()` started with no synchronization barrier
- `tests/lib/lifecycle-background-observer.test.ts:107,286` — tests encode and reinforce `idle → completed` assumption
- `session-ses_28b9+WTF_WRONG.md:3899-4214` — 4 tasks "completed" in 15ms, 28ms, 39ms, 36ms

---

### RC-3: Parent Observability Is Structurally Incomplete

**Severity:** HIGH — parent can lose visibility into child outcomes even when work runs correctly

**Three failure modes:**

**A. Started notifications bypass offline fallback:**
- `runLifecycleSubsessionTask()` at line 297 calls `notifyParentSession()` directly in the `.then()` callback
- No `persistPendingNotification()` wrapper — if parent isn't available, the "started" signal is lost forever

**B. Completion/failure fallback depends on parent continuity record:**
- `notifyParentWithFallback()` at `lifecycle-background-observer.ts:244` calls `persistPendingNotification(parentSessionID, task)`
- `persistPendingNotification()` at `pending-notifications.ts:32` returns `undefined` if parent has no continuity record
- Parent continuity records are NOT generally created — only child sessions are recorded at `lifecycle-manager.ts:261`

**C. Pending notifications have no consumer:**
- `formatPendingNotificationsForSession()` exists at `pending-notifications.ts:67`
- No runtime call site uses it — searched all of `src/`, found only the definition
- Persisted notifications exist on disk but nobody reads them

**Evidence chain:**
- `src/lib/pending-notifications.ts:32` — returns undefined without parent continuity record
- `src/lib/continuity.ts:202` — `recordSessionContinuity()` only called for children
- `src/lib/lifecycle-manager.ts:261` — child-only continuity recording
- `src/lib/pending-notifications.ts:67` — `formatPendingNotificationsForSession()` defined but never called
- `.planning/debug/live-steering-silent-timeout-delegation-2026-04-09.md` — parent `ses_28dd5ecdbffeYKfDzHwEBjv5p2` missing from continuity store

---

### RC-4: Semantic Design Bug — Terminology Collision

**Severity:** MEDIUM — causes LLM and human confusion about which system is being used

**Two different "background" concepts:**

| Concept | What it does | Where |
|---------|-------------|-------|
| `delegate-task` + `run_in_background: true` | Async OpenCode child-session delegation | `src/tools/delegate-task.ts` |
| `background` tool | OS subprocess management (spawn/list/kill/wait) | `src/tools/background/index.ts` |

**The `run_in_background` boolean:**
- Description says: "When true, returns immediately — continue with other work"
- Provides NO decision criteria for when to use true vs false
- Doesn't clarify that it controls response timing, NOT execution mode selection
- LLM has no framework to decide: "should I use sync or async?"

**Evidence chain:**
- `src/tools/delegate-task.ts:215` — arg description lacks guidance
- `src/tools/background/index.ts:55` — completely different system, same word
- Live steering protocols paper distinguishes "async delegation" from "background processes"

---

## Execution Path Trace for the Reported Transcript

From `session-ses_28b9+WTF_WRONG.md:3899`:

```
1. delegate-task receives run_in_background: true
   → specialist route resolves (builder/researcher)
   → route metadata shows effectiveAgent, temperature, etc.

2. buildTaskCharacteristics() marks as isResearch: true, isHeadless: true
   → classifyExecutionMode() returns { family: "builtin", submode: "builtin-process" }
   → THIS IS A LIE — no one actually runs builtin-process

3. launchDelegatedSession() calls resolveEffectiveExecutionMode()
   → rewrites builtin-process → builtin-subsession
   → rationale: "builtin-process fallback: routed through builtin-subsession"
   → route metadata STILL says builtin-process

4. Child session created via client.session.create()
   → continuity recorded for CHILD only (not parent)
   → delegation metadata built with execution.submode: "builtin-subsession"

5. lifecycle patched to "running" phase
   → launchedAt timestamp recorded
   → observation: "prompt-dispatched-async"

6. runLifecycleSubsessionTask() called:
   a. sendPromptAsync(client, sessionID, body) → 204 immediately
   b. .then() callback fires: started notification attempted
      → notifyParentSession() — best effort, no offline fallback
   c. observeBackgroundCompletion() started — no synchronization

7. Observer's FIRST poll (0ms delay):
   → checkSessionExists() → client.session.get(sessionID)
   → status: "idle" (agent hasn't started yet!)
   → statusType === "idle" → patchLifecycle("completed")
   → notifyParentSession() → "Builder completed work on..."
   → duration: completedAt - launchedAt = 15-39ms

8. No artifacts created — no work was ever performed
```

---

## Comprehensive Fix Plan

### Fix A: Make the Architecture Honest (addresses RC-1)

**Scope:** `src/lib/lifecycle-manager.ts`, `src/tools/delegate-task.ts`, `src/lib/execution-mode.ts`, tests

**What to do:**
1. Remove `resolveEffectiveExecutionMode()` — stop the silent rewrite
2. Remove `builtin-process` from the classifier and test expectations
3. OR: Actually implement `builtin-process` by wiring `runLifecycleProcessTask()` into the launcher
4. Update all tests to reflect the ONE real execution path
5. Update route metadata to accurately report `builtin-subsession`

**Impact:** Eliminates the largest source of diagnostic misdirection. Tests, metadata, and runtime finally agree.

---

### Fix B: Harden the Completion Observer (addresses RC-2)

**Scope:** `src/lib/lifecycle-background-observer.ts`, `src/lib/lifecycle-process-runner.ts`, tests

**What to do:**
1. Add `seenBusy` flag to the observer loop
2. Only treat `idle` as completed when `seenBusy === true`
3. Add initial grace delay (2-5s) before first poll as a hedge
4. Add message-count verification: poll `client.session.messages()` and verify count > 1
5. Update tests to verify: "first poll sees idle before any busy → NOT completed"

**Impact:** Eliminates the instant false-success class of failures. 15ms "completions" become impossible.

---

### Fix C: Repair Parent Observability (addresses RC-3)

**Scope:** `src/lib/lifecycle-manager.ts`, `src/lib/pending-notifications.ts`, `src/lib/lifecycle-process-runner.ts`

**What to do:**
1. Record parent session continuity when `launchDelegatedSession()` is called
2. Wrap started notifications with `persistPendingNotification()` offline fallback
3. Add a replay hook: call `formatPendingNotificationsForSession()` when a session resumes or starts
4. Add a tool or hook that surfaces pending notifications to the parent agent

**Impact:** Parent can always see child outcomes, even across session restarts and turn boundaries.

---

### Fix D: Clarify Terminology (addresses RC-4)

**Scope:** `src/tools/delegate-task.ts`, `src/tools/background/index.ts`

**What to do:**
1. Rename `background` tool → `run-process` or `spawn-process`
2. Update `run_in_background` arg description with decision criteria:
   - Use `true` for long-running tasks (research, scanning, analysis >30s)
   - Use `false` for quick tasks needing immediate results (validation, summarization <30s)
3. Add tool description clarifying this controls response timing, not execution mode

**Impact:** Eliminates LLM and human confusion between the two background concepts.

---

## Recommended Fix Order

| Order | Fix | Rationale |
|-------|-----|-----------|
| **1** | Fix B (observer) | Immediate blast radius reduction — stops the false-success bleeding |
| **2** | Fix A (architecture) | Root cause elimination — aligns runtime, metadata, tests |
| **3** | Fix C (parent observability) | Durability — ensures parent can always see child outcomes |
| **4** | Fix D (terminology) | Clarity — prevents future confusion and misdiagnosis |

Fix B alone is a band-aid that stops the immediate pain.
Fix A alone is architecturally correct but doesn't fix the live bug.
Fix C alone delivers wrong status signals faster — harmful without B.
Fix D alone is cosmetic — doesn't fix anything functional.

**All four together** constitute the complete systemic repair.

---

## Open Questions

1. Is there any runtime hook outside `src/` that replays `pendingNotifications` into parent sessions? (Search found no consumer.)
2. Was the product intent to permanently abandon owned-process delegation, or is `resolveEffectiveExecutionMode()` meant to be temporary?
3. Do current user-visible failures include both "instant false completion" AND "long timeout then blind parent" in the same build, or are those on different revisions?

---

## Files Changed Summary

| File | RC | Fix |
|------|----|-----|
| `src/lib/lifecycle-manager.ts` | RC-1, RC-3 | Remove rewrite, record parent continuity |
| `src/lib/lifecycle-background-observer.ts` | RC-2 | Add seenBusy, initial delay, message verification |
| `src/lib/lifecycle-process-runner.ts` | RC-2, RC-3 | Add synchronization barrier, wrap started notification |
| `src/lib/pending-notifications.ts` | RC-3 | Add consumer/replay hook for pending notifications |
| `src/tools/delegate-task.ts` | RC-4 | Update run_in_background arg description |
| `src/tools/background/index.ts` | RC-4 | Rename to run-process/spawn-process |
| `src/lib/execution-mode.ts` | RC-1 | Remove builtin-process from classifier |
| `tests/lib/lifecycle-background-observer.test.ts` | RC-2 | Add test: idle-before-busy → NOT completed |
| `tests/lib/execution-mode.test.ts` | RC-1 | Align with actual runtime (no builtin-process) |
| `tests/lib/background-manager-harden.test.ts` | RC-1 | Align with actual runtime (no builtin-process rewrite) |
