---
status: closed
trigger: "persistent-background-false-success-no-polling-no-observability — COMPREHENSIVE PIPELINE TRACE"
created: "2026-04-10T12:00:00.000Z"
updated: "2026-04-14T18:04:00.000Z"
resolution: "diagnosed — addressed by completion-verifier two-poll stability in Phase 09.2 Plan 01; integration wiring via Plans 02-03 pending"
---

## Current Focus

hypothesis: The background observer (`lifecycle-background-observer.ts`) conflates "idle" (never started / not yet processing) with "completed" (finished working). The OpenCode session status model has only 3 states: idle, busy, retry. A freshly created session that receives `promptAsync()` returns 204 immediately — but the agent hasn't started yet, so status is "idle". The observer's first poll check (no initial sleep) sees "idle" and marks it complete. The root cause is a state machine design flaw: there is NO tracking of whether the session ever transitioned through "busy".

test: Trace the entire pipeline from delegate-task entry through observer completion, verifying each state transition point.

expecting: Confirmation that the observer's first poll iteration fires before the child agent starts processing, capturing the "idle" status of a not-yet-started session.

next_action: Write comprehensive root cause report based on full pipeline trace.

## Symptoms

expected: Background delegated tasks should run for meaningful duration (seconds/minutes), produce observable output, be trackable by parent via polling/notifications, and queue properly when concurrency limits are hit. The session status should transition: created→busy(processing)→idle(done).
actual: 4 tasks launched with full lifecycle metadata, all "completed" in 15ms, 28ms, 39ms, 36ms — no actual work performed. Parent receives completion notifications with "Builder completed work on..." summaries but no output artifacts were created. The sessions exist (confirmed by session IDs in response), but terminate instantly.
errors: False-success pattern — delegate-task returns ok:true, mode:"async", valid session IDs, valid lifecycle state, but child sessions terminate immediately without doing work.
reproduction: Use delegate-task with run_in_background:true on file-scanning prompts. Sessions launch, return ok:true immediately, then fire completion notifications within milliseconds. No artifacts written.
started: Pattern observed in session ses_28b947bc3ffeC0motr0IJ4Gm11 on 2026-04-10. Related to prior delegation failures documented in .planning/debug/ files.

## Eliminated

- hypothesis: Queue starvation — lanes acquired immediately, active counts 1/2/3
  evidence: Prior investigation confirmed queue lanes acquired immediately, active counts correct
  timestamp: "2026-04-09"
- hypothesis: Agent misrouting — explicit researcher routing with fallbackUsed: false
  evidence: Prior investigation confirmed agent routing correct, fallbackUsed: false
  timestamp: "2026-04-09"
- hypothesis: Async dispatch elimination — sendPromptAsync() works, children launched
  evidence: promptAsync() returns 204, sessions created, child session IDs valid
  timestamp: "2026-04-09"

## Evidence

- timestamp: "2026-04-10T12:00:00.000Z"
  checked: src/lib/lifecycle-background-observer.ts — observeBackgroundCompletion()
  found: First iteration of `while (now() < deadline)` loop calls `checkSessionExists()` immediately — NO initial sleep before first poll. If `statusType === "idle"` → marks as "completed" immediately.
  implication: A session that hasn't started processing yet (still "idle" from creation) will be falsely detected as completed on the very first poll, which fires within milliseconds of dispatch.

- timestamp: "2026-04-10T12:00:00.000Z"
  checked: src/lib/lifecycle-process-runner.ts — runLifecycleSubsessionTask()
  found: When runInBackground: true: (1) calls sendPromptAsync() — returns immediately with 204, (2) spawns .then() callback for started notification (async, fire-and-forget), (3) calls observeBackgroundCompletion() — the poller, (4) returns JSON response to caller immediately. All three steps are non-blocking fire-and-forget.
  implication: The observer starts polling BEFORE the started notification's .then() callback even fires. There is zero synchronization between prompt dispatch and observer's first poll.

- timestamp: "2026-04-10T12:00:00.000Z"
  checked: src/lib/session-api.ts — sendPromptAsync()
  found: Calls `client.session.promptAsync({ path: { id: sessionID }, body })` — returns 204 (Accepted) immediately. The OpenCode platform receives the prompt but has NOT yet started the agent.
  implication: Between promptAsync() returning 204 and the agent actually processing the prompt, the session status is "idle" — it exists but is not yet working.

- timestamp: "2026-04-10T12:00:00.000Z"
  checked: OpenCode session status semantics (from live-steering-protocols.md)
  found: `client.session.status()` returns `{ [sessionID]: { type: "idle" | "busy" | "retry" } }`. "idle" = session exists but not currently processing. "busy" = session is actively working. "retry" = session hit an error and is retrying.
  implication: There is NO distinction between "idle because never started" and "idle because finished working". The status model is fundamentally insufficient for async delegation completion detection.

- timestamp: "2026-04-10T12:00:00.000Z"
  checked: .opencode/state/opencode-harness/session-continuity.json — child sessions of ses_28b947bc3ffe
  found: Child sessions show `runInBackground: true`, `status: "completed"`, lifecycle phase "completed", with launchedAt and completedAt timestamps. But continuity records show the execution submode was "builtin-subsession" for some and "builtin-process" for others.
  implication: The continuity store reflects what the observer reported — but the observer was wrong. The continuity store faithfully records an incorrect state.

- timestamp: "2026-04-10T12:00:00.000Z"
  checked: src/lib/lifecycle-background-observer.ts — checkSessionExists() implementation
  found: Uses `client.session.get(sessionID)` (direct lookup), falls back to status map. Extracts `status.type` from response. If no status field found, assumes "busy" (line: `return { type: "busy" }`).
  implication: The fallback assumption of "busy" when no status field exists is a safety net, but when status IS present and is "idle", there's no safety net.

- timestamp: "2026-04-10T12:00:00.000Z"
  checked: src/lib/lifecycle-background-observer.ts — observer loop timing
  found: `const pollIntervalMs = DEFAULT_POLL_INTERVAL_MS` (15000ms). After checking "busy" status, calls `await doSleep(pollIntervalMs)`. But the FIRST check happens before any sleep. The loop structure is: check → if idle→complete → if busy→sleep → repeat.
  implication: If the first check sees "idle" (because the agent hasn't started yet), the observer completes immediately — no sleep, no waiting, no second chance.

- timestamp: "2026-04-10T12:00:00.000Z"
  checked: src/tools/background/index.ts vs delegate-task's run_in_background
  found: The `background` tool manages OS subprocesses (spawn, list, status, cancel, wait). `delegate-task`'s `run_in_background` boolean controls whether the child OpenCode session runs async or sync. These are completely different systems that share the word "background".
  implication: LLM confusion between these two "background" concepts is a secondary finding. The naming collision may cause the LLM to think `run_in_background: true` means "manage as OS process" when it actually means "dispatch as async OpenCode session".

- timestamp: "2026-04-10T12:00:00.000Z"
  checked: src/lib/execution-mode.ts — classifyExecutionMode()
  found: For tasks with `isResearch: true` AND `runInBackground: true` AND no tmux → resolves to `builtin-process` submode. `builtin-process` executes via `runLifecycleProcessTask()` which spawns a Node.js child process, NOT an OpenCode session. For `isInteractive: true` → resolves to `builtin-subsession` which uses `runLifecycleSubsessionTask()` with OpenCode sessions.
  implication: There are TWO different async execution paths. The "builtin-process" path uses OS subprocesses and has its own completion detection (process exit). The "builtin-subsession" path uses OpenCode sessions and suffers from the idle≠completed bug.

- timestamp: "2026-04-10T12:00:00.000Z"
  checked: src/lib/lifecycle-process-runner.ts — runLifecycleProcessTask() vs runLifecycleSubsessionTask()
  found: `runLifecycleProcessTask()` uses `backgroundManager.spawn()` → `backgroundManager.onComplete()` which waits for the actual OS process to exit. `runLifecycleSubsessionTask()` uses `sendPromptAsync()` → `observeBackgroundCompletion()` which polls session status.
  implication: The OS process path has reliable completion detection (process exit event). The OpenCode session path has unreliable completion detection (polling ambiguous "idle" status).

- timestamp: "2026-04-10T12:00:00.000Z"
  checked: The notification pipeline — buildTaskNotificationFromContinuity() → notifyParentSession()
  found: When observer marks session "completed" (falsely), patchLifecycle() updates continuity, then notifyParentSession() fires a "completed" notification to the parent. The notification includes summary text like "Builder completed work on..." built from the continuity record.
  implication: The notification pipeline faithfully amplifies the observer's false-positive. The parent receives what looks like a legitimate completion notification with full metadata — creating the "false-success illusion".

## Resolution

root_cause: The `observeBackgroundCompletion()` function in `lifecycle-background-observer.ts` has a fundamental state machine design flaw: it treats OpenCode's session status "idle" as equivalent to "completed". However, "idle" in OpenCode's status model means "not currently processing" — which is true BOTH for sessions that have never started working AND sessions that have finished working.

The complete failure chain:

1. **Dispatch**: `sendPromptAsync()` fires the prompt to OpenCode, returns 204 immediately. The prompt is queued but the agent has NOT started processing yet.

2. **Observer starts immediately**: `observeBackgroundCompletion()` enters its while loop and calls `checkSessionExists()` on the FIRST iteration with NO initial sleep.

3. **False completion**: `checkSessionExists()` calls `client.session.get(sessionID)`, extracts `status.type` which is "idle" (because the agent hasn't started yet). The observer interprets "idle" as "completed" and fires completion notification.

4. **Notification cascade**: The completion notification is built from continuity data and sent to the parent, creating the illusion that work was done. The parent sees `ok: true`, valid session IDs, and a "completed" notification — but no work occurred.

5. **No busy transition tracking**: The observer never tracks whether the session ever transitioned through "busy" state. Without this tracking, "idle" is indistinguishable from "never started".

**Why this is architectural, not incidental:**

The OpenCode session status model (`idle | busy | retry`) is fundamentally insufficient for async delegation completion detection. It lacks:
- A "queued" state (prompt received but not yet processing)
- A "completed" state (work finished, distinct from idle)
- Any mechanism to distinguish "idle because done" from "idle because not started"

The harness attempted to work around this by polling, but the polling logic itself is flawed: it checks for "idle" as the completion signal without ensuring the session ever entered "busy" first.

**The systemic fix requires:**

1. **State machine enhancement**: Track whether the session ever transitioned through "busy" before treating "idle" as completion. Add a `seenBusy` flag to the observer's local state.

2. **Initial delay**: Add an initial sleep (e.g., 2-5 seconds) before the first poll to give the agent time to start processing. This prevents the race condition where the first poll fires before the agent begins.

3. **Message count verification**: As a secondary verification, poll `client.session.messages()` and check that the message count has increased from the initial state. A session that never worked will have only the initial user message.

4. **Alternative: Event-based completion**: Instead of polling session status, listen for specific events (session.diff, session.compacted) that indicate actual work was performed.

**Secondary findings:**

A. **Background tool naming collision**: The `background` tool (`src/tools/background/index.ts`) manages OS subprocesses. `delegate-task`'s `run_in_background` boolean controls async OpenCode session dispatch. The naming collision causes LLM confusion about which "background" system is being used.

B. **run_in_background ambiguity**: The tool description says "When true, returns immediately — continue with other work" but provides NO decision criteria for WHEN to use true vs false. The LLM has no guidance on when background vs foreground delegation is appropriate.

C. **Two execution paths confusion**: The `execution-mode.ts` classifier routes to either `builtin-process` (OS subprocesses) or `builtin-subsession` (OpenCode sessions). Research tasks with `runInBackground: true` and no tmux get routed to `builtin-process`, which actually works correctly (process exit = completion). But interactive tasks get routed to `builtin-subsession`, which suffers from the idle≠completed bug.

fix: NOT APPLIED (mode: find_root_cause_only)

verification: NOT APPLIED (mode: find_root_cause_only)

files_changed: []
