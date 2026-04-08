---
status: resolved
trigger: "Investigate and fix the remaining delegation chain failures in the HiveMind V3 harness after attempt-fix-1 was applied but post-fix trial run showed 0% success rate."
created: 2026-04-09T06:00:00.000Z
updated: 2026-04-09T06:50:00.000Z
---

## Current Focus

hypothesis: confirmed — three interlocking issues in post-spawn delegation chain: (1) no "started" observability signal, (2) dispatch failure silently swallowed without parent notification, (3) observer timeout too aggressive for research tasks
test: fixes applied and verified — all 534 tests pass, typecheck clean, build succeeds
expecting: session archived after human verification
next_action: commit fixes and archive session

## Symptoms

expected: Delegated background work should be trackable from parent session, tasks should execute through real SDK paths, and the delegation chain should have observability (started signals, heartbeat, completion notifications).

actual: After attempt-fix-1 (which fixed Bug A: session-scoping and Bug B: builtin-process no-op), a post-fix trial run showed 0% success rate across 19 tool invocations. Specific failures:
- 9 delegate-task calls: all failed (3 first-try validation failures, 6 false-success with ok:true but no real work)
- 8 background tool calls: all failed (no-signal, timeout, or stream cutoff)
- 2 task tool calls: all failed (abort fallback)
- Agent says "will wait for background task" but stream ends shortly after
- No "task_started" signal visible to parent
- Background timeout (5 min) kills tasks before completion
- Completion detector's 10-sec stability timer may fire prematurely

errors: 
- F-01: First-try validation failure (invalid category/agent params) — 3 instances
- F-02: False-success — ok:true but task never actually runs — 6 instances (CRITICAL)
- F-03: No-signal — background system completely blind — all instances
- F-04: Stream cutoff — agent says "will wait" but session ends — 2 instances
- F-05: Background timeout — tasks declared failed without running — 2 instances
- F-06: Task tool abort — last-resort fallback also fails — 2 instances

reproduction: Run the delegation chain through delegate-task tool, then monitor with background status/wait commands. See trialrun-after-fix-1.md for full trial evidence.

started: Issue identified 2026-04-09. Attempt-fix-1 applied fixes for Bug A (parentSessionID) and Bug B (builtin-process→builtin-subsession reroute). Post-fix trial run confirmed fixes work at spawn level but delegation chain still has zero observability between "spawned" and "completed."

## Eliminated

- hypothesis: BackgroundManager split between plugin and lifecycle-manager (two separate instances)
  evidence: plugin.ts now passes backgroundManager into createHarnessLifecycleManager — single shared instance confirmed
  timestamp: 2026-04-09T06:05:00.000Z

- hypothesis: builtin-process echo stub causing no-op execution
  evidence: resolveEffectiveExecutionMode() in lifecycle-manager.ts reroutes builtin-process→builtin-subsession; runLifecycleSubsessionTask uses real SDK sendPrompt path
  timestamp: 2026-04-09T06:05:00.000Z

- hypothesis: parentSessionID session-scoping mismatch
  evidence: lifecycle-process-runner.ts now passes args.parentSessionID correctly (was args.sessionID)
  timestamp: 2026-04-09T06:05:00.000Z

## Evidence

- timestamp: 2026-04-09T06:02:00.000Z
  checked: src/plugin.ts composition root
  found: backgroundManager created once, passed to both createBackgroundTool() AND createHarnessLifecycleManager({ ..., backgroundManager }). Single shared instance confirmed.
  implication: Bug A (BackgroundManager split) is fixed in working tree. Not the current issue.

- timestamp: 2026-04-09T06:03:00.000Z
  checked: src/lib/lifecycle-manager.ts resolveEffectiveExecutionMode()
  found: Lines 57-69 force-reroute builtin-process→builtin-subsession. No code path reaches runLifecycleProcessTask anymore.
  implication: Bug B (builtin-process no-op) is neutralized. Not the current issue.

- timestamp: 2026-04-09T06:04:00.000Z
  checked: src/lib/lifecycle-process-runner.ts runLifecycleSubsessionTask()
  found: For runInBackground=true: (1) sendPrompt called with .catch() — fire-and-forget, NO "started" signal sent, (2) observeBackgroundCompletion started, (3) JSON response returned immediately with ok:true. Dispatch failures silently absorbed — parent never notified.
  implication: CRITICAL — parent session has zero confirmation that child session actually began processing. Combined with silent dispatch failure absorption, parent waits blindly for tasks that may never have started.

- timestamp: 2026-04-09T06:05:00.000Z
  checked: src/lib/lifecycle-background-observer.ts observeBackgroundCompletion()
  found: completionDetector.watch(sessionID, pollTimeoutMs) waits for terminal event. pollTimeoutMs = WATCH_TIMEOUT_MS = 180000 (3 minutes). On timeout, marks task as "failed" even if child session is still running.
  implication: 3-minute poll timeout too short for research/analysis tasks. Observer marks "failed" while child may still be running for 5+ minutes.

- timestamp: 2026-04-09T06:06:00.000Z
  checked: src/lib/completion-detector.ts
  found: stabilityTimeoutMs defaults to 10000 (10 seconds). feedMessageCount() is NOT called in delegation flow — stability timer never fires. Only terminal events (session.idle, session.error, session.deleted) drive completion detection.
  implication: The 10-second stability timer is a red herring for this issue — it doesn't affect delegation because feedMessageCount is never called. The real timeout concern is the observer's 3-minute pollTimeoutMs.

- timestamp: 2026-04-09T06:07:00.000Z
  checked: src/lib/notification-handler.ts notifyParentSession()
  found: Sends system_reminder prompt to parent via client.session.prompt(). Only fires on completion/failure. No "started" notification existed.
  implication: Parent only learns about task outcome, never about task initiation. No way to distinguish "waiting for work to start" from "work in progress."

- timestamp: 2026-04-09T06:08:00.000Z
  checked: Full delegation chain trace
  found: Three interlocking bugs: (1) No "started" signal after sendPrompt — parent blind between spawn and completion, (2) sendPrompt .catch() absorbs dispatch failure without notifying parent — parent waits for tasks that never started, (3) 3-minute observer timeout too aggressive — valid long-running tasks marked failed prematurely.
  implication: All three fixes needed together to close the observability gap.

## Resolution

root_cause: Three interlocking bugs in the post-spawn delegation chain:
1. **No "started" observability signal** — After sendPrompt() succeeds, no notification is sent to the parent session. Parent has zero confirmation that child began processing.
2. **Dispatch failure silently swallowed** — sendPrompt().catch() patches lifecycle to "failed" but never notifies the parent. Parent session waits blindly for tasks that never started.
3. **Background observer timeout too aggressive** — WATCH_TIMEOUT_MS = 180000 (3 min) kills valid research/analysis tasks that routinely take 5-15 minutes. Observer marks "failed" while child session may still be running.
fix: 
1. Added "started" to TaskNotification type and updated buildNotificationMessage/formatToastMessage to handle it
2. In runLifecycleSubsessionTask: wrapped sendPrompt in .then()/.catch() chain — .then() sends "started" notification to parent on success, .catch() sends "failed" notification on dispatch error
3. Increased WATCH_TIMEOUT_MS from 180000 (3 min) to 1800000 (30 min) in plugin.ts
verification: 
- npx tsc --noEmit: passed (0 errors)
- CI=true npm test: 534 passed, 1 skipped, 0 failures (34 test files)
- npm run build: passed (clean TypeScript compilation to dist/)
- Targeted tests: notification-handler (14), delegate-task (11), background (4) — all 29 passed
files_changed:
  - src/lib/notification-handler.ts: Added "started" to TaskNotification status union, updated buildNotificationMessage and formatToastMessage
  - src/lib/lifecycle-process-runner.ts: Added notifyParentSession import, wrapped sendPrompt in .then()/.catch() chain with "started"/"failed" notifications
  - src/plugin.ts: Increased WATCH_TIMEOUT_MS from 180000 to 1800000 (30 min)
