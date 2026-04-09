---
status: resolved
trigger: "Fix the root cause of the delegation chain failure in HiveMind V3 harness. After extensive investigation, the core issue has been identified: parent session not kept alive during background delegation"
created: 2026-04-09T07:00:00.000Z
updated: 2026-04-09T08:15:00.000Z
---

## Current Focus

hypothesis: confirmed and fixed — event-based completion detection replaced with SDK polling
test: all 541 tests pass, type-check and build succeed
expecting: background delegation will now work correctly
next_action: session complete

## Symptoms

expected: background delegated child sessions should complete, have their lifecycle state updated to "completed", and notify the parent session when done.
actual: child sessions may run but their completion is never detected — 0% success rate, tasks spawn but output is never collected.
errors: none explicit — silent failure. Stream cutoff in logs, session ends before child completes.
reproduction: delegate a task in background mode, observe that child session runs but parent never receives completion notification.
started: identified after 3 failed fix attempts (commits 9df4cd75, 35b0cdf4 fixed bugs A and B but core issue remains).

## Eliminated

- hypothesis: completionDetector.watch() can reliably detect child session completion via event propagation
  evidence: events (session.idle, session.error, session.deleted) are not propagated from child sessions to parent's CompletionDetector — parent session terminates before child completes
  timestamp: 2026-04-09T07:10:00.000Z

## Evidence

- timestamp: 2026-04-09T07:05:00.000Z
  checked: src/lib/lifecycle-background-observer.ts
  found: observeBackgroundCompletion blocks on completionDetector.watch() which waits for terminal events
  implication: if events don't arrive, observer blocks indefinitely or times out

- timestamp: 2026-04-09T07:08:00.000Z
  checked: src/lib/completion-detector.ts
  found: feed() method only resolves watchers when called with terminal events — but handleEvent() in lifecycle-manager.ts only feeds events for the session that triggered them
  implication: child session events don't reach parent's completion detector

- timestamp: 2026-04-09T07:15:00.000Z
  checked: OpenCode SDK types (node_modules/@opencode-ai/sdk)
  found: client.session.status() returns map of all session IDs to their status (idle/busy/retry)
  implication: can poll child session status directly without relying on event propagation

- timestamp: 2026-04-09T07:20:00.000Z
  checked: session-api.ts
  found: no helper for session.status() endpoint
  implication: need to add getSessionStatusMap() helper

- timestamp: 2026-04-09T08:00:00.000Z
  checked: implemented polling-based observer
  found: polls every 15s, checks status map, detects idle/busy/retry/deleted states
  implication: observer no longer depends on event propagation

- timestamp: 2026-04-09T08:10:00.000Z
  checked: test suite
  found: 7 new tests for polling observer, all 541 tests pass
  implication: fix is verified and doesn't break existing functionality

## Resolution

root_cause: CompletionDetector.watch() in observeBackgroundCompletion() blocked on terminal events (session.idle, session.error, session.deleted) that were never propagated from child sessions to the parent's completion detector. The parent session terminated after dispatching the child, leaving the background observer waiting for events that would never arrive. The 30-minute timeout eventually fired, but by then the parent was long gone and lifecycle state was never updated.
fix: Replaced event-based CompletionDetector.watch() with direct SDK polling using client.session.status(). The observer now polls the status map every 15 seconds, checks the child session's status directly, and updates lifecycle state when idle/busy/retry/deleted is detected. Added getSessionStatusMap() helper to session-api.ts.
verification: All 541 tests pass (including 7 new tests for polling observer), npx tsc --noEmit succeeds, npm run build succeeds. Observer correctly handles idle (complete), busy (continue polling), retry (error), deleted (error), timeout (error), and SDK failure (error) cases.
files_changed: ["src/lib/lifecycle-background-observer.ts", "src/lib/session-api.ts", "tests/lib/lifecycle-background-observer.test.ts"]
