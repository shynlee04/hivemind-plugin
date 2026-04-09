---
status: investigating
trigger: "Investigate issue: live-steering-silent-timeout-delegation-2026-04-09"
created: 2026-04-09T00:00:00.000Z
updated: 2026-04-09T00:49:00.000Z
---

## Current Focus

hypothesis: the dominant current failure is a combined polling/notification design gap: dispatch succeeds, but parent observability depends on a long blind busy-loop and notification fallback that cannot persist to parents not present in continuity, making the main agent appear hung until timeout
test: validate the observer timeout behavior, parent continuity presence, and notification persistence path against the exact child sessions from the failing run
expecting: evidence that timeout + missing parent fallback explains the main agent hang better than queue starvation, routing error, or dispatch failure
next_action: finalize diagnosis and rank the contributing factors for the orchestrator handoff

## Symptoms

expected: background delegation should spawn real child work, remain observable to the parent, survive parent turn boundaries via async session dispatch, progress through queue/lifecycle states coherently, and support live-steering/agent-selection decisions without false success or silent timeout.
actual: delegate-task often returns ok:true / running metadata, but the latest failure packet and recent diagnostics show zero useful output, blind waiting, stream cutoff, background timeouts, queue/poll ambiguity, and likely races between async dispatch, polling, and notification.
errors: false-success pattern; background task not found in earlier runs; no started signal; background polling timed out; session may look idle/deleted/retry without validated output; tool execution aborted in fallback cases.
reproduction: use the supplied docs and current source; trace the exact end-to-end path for async delegation and compare it with the live-steering architecture assumptions.
started: prior diagnosis on 2026-04-09 identified manager split, ownership mismatch, and builtin-process no-op; later post-fix trial still reported 0% success with new timeout / observability / stream-cutoff failure modes; latest failure artifact is fail-silently-timout-session.md.

## Eliminated

## Evidence

- timestamp: 2026-04-09T00:04:00.000Z
  checked: prior debug reports and current source for delegate-task, lifecycle-manager, lifecycle-process-runner, plugin
  found: earlier diagnosis correctly identified manager split, parent-child ownership mismatch, and builtin-process no-op as the original false-success chain, but current source now passes a shared BackgroundManager into createHarnessLifecycleManager, uses args.parentSessionID in runLifecycleProcessTask, and reroutes builtin-process to builtin-subsession through resolveEffectiveExecutionMode
  implication: the latest failure must be reconciled against a newer post-fix path; repeating the old diagnosis alone would be incomplete

- timestamp: 2026-04-09T00:06:00.000Z
  checked: plugin.ts, lifecycle-manager.ts, lifecycle-process-runner.ts, lifecycle-background-observer.ts
  found: current async background path uses sendPromptAsync(), returns success metadata immediately, emits a best-effort started notification only after promptAsync resolves, and relies on observeBackgroundCompletion polling with a 30-minute WATCH_TIMEOUT_MS
  implication: the main risk surface has shifted from \"child never launched\" toward \"child launch is not durably observable/validated between dispatch and completion\"

- timestamp: 2026-04-09T00:09:00.000Z
  checked: skill/debug context bootstrap
  found: .planning/debug/knowledge-base.md exists, while the referenced local debug guides were not found at /references/... in this worktree
  implication: resume/knowledge-base context is available, but some expected investigator reference paths are stale and cannot be treated as authoritative inputs

- timestamp: 2026-04-09T00:15:00.000Z
  checked: .planning/debug/knowledge-base.md
  found: the closest resolved pattern is delegation-chain-post-fix-investigation, which attributes 0 percent success to missing started observability, swallowed dispatch failures, and an overly short watch timeout; its recorded fixes match code now present in notification-handler.ts, lifecycle-process-runner.ts, and plugin.ts
  implication: if the same symptom family still appears, the remaining issue is either outside those fixes or due to the fixes being insufficient under real parent/child session semantics

- timestamp: 2026-04-09T00:18:00.000Z
  checked: notification-handler.ts and lifecycle-background-observer.ts
  found: parent notifications are sent with client.session.prompt() in best-effort mode and failures are swallowed; completed/failed notifications can be persisted offline, but the started notification path in runLifecycleSubsessionTask does not use the offline fallback wrapper
  implication: the parent can still be blind to successful child dispatch starts even after sendPromptAsync resolves, which preserves a false-success / silent-wait window

- timestamp: 2026-04-09T00:24:00.000Z
  checked: fail-silently-timout-session.md and trialrun-after-fix-1.md
  found: the latest failure export records three async delegate-task success payloads and three started reminders but no completion/failure reminders before the parent transcript ends; the earlier post-fix trial explicitly shows failed completion reminders with \"Background completion timed out\"
  implication: parent-visible evidence is inconsistent across runs, pointing to a gap between child lifecycle reality and what the parent session actually receives before its own stream ends

- timestamp: 2026-04-09T00:27:00.000Z
  checked: lifecycle queue and execution state
  found: the latest failure packet shows concurrency_active 1/2/3 with concurrency_pending 0 and queue observation detail prompt-dispatched-async for each launched researcher child
  implication: queue starvation is not the primary failure mode in the captured latest run; the breakdown happens after queue acquisition and async dispatch

- timestamp: 2026-04-09T00:34:00.000Z
  checked: .opencode/state/opencode-harness/session-continuity.json for the exact child session IDs from fail-silently-timout-session.md
  found: `ses_28db35a12ffe9FP98R6OGALg6s` and `ses_28db35a0cffe7hQSh9fHpAKsGb` are persisted as completed, `ses_28db359feffekvIoDj36pAmy6s` remains running, and the parent session itself is not present in the continuity store snapshot
  implication: the parent export's apparent silent timeout is not equivalent to universal child failure; the parent lost synchronized visibility into child outcomes

- timestamp: 2026-04-09T00:35:00.000Z
  checked: persisted lifecycle snapshot for `ses_28db359feffekvIoDj36pAmy6s`
  found: the record shows status `running` and phase `running` while also carrying a non-null `completedAt` timestamp and a later observation source `event:message.part.delta`
  implication: lifecycle state can become internally contradictory after async dispatch, which is strong evidence of event/status remapping drift rather than a simple timeout-only failure

- timestamp: 2026-04-09T00:41:00.000Z
  checked: notification fallback path and parent continuity presence
  found: `notifyParentWithFallback()` persists offline notifications only through `patchSessionContinuity(parentSessionID, ...)`, but the parent session `ses_28dd5ecdbffeYKfDzHwEBjv5p2` is missing from `.opencode/state/opencode-harness/session-continuity.json`
  implication: even completed/failed notifications can be silently dropped when the parent session is not itself recorded in continuity; this leaves the main agent hanging on stale assumptions

- timestamp: 2026-04-09T00:43:00.000Z
  checked: child session timing from continuity store
  found: two child sessions from the failing run completed after roughly 6 minutes and 13 minutes, while the third remained active until approximately the 30-minute observer window before ending in error
  implication: the long hang is consistent with `WATCH_TIMEOUT_MS = 1800000` and a coarse busy/until-timeout polling loop, not with immediate dispatch failure or queue blockage

- timestamp: 2026-04-09T00:45:00.000Z
  checked: user symptom update
  found: reporter confirms the main agent takes a very long time to time out and then gets stuck hanging
  implication: real user experience matches the observer-timeout + missing parent notification persistence diagnosis

- timestamp: 2026-04-09T00:48:00.000Z
  checked: latest reporter clarification
  found: reporter has tried twice and suspects the background child may have failed very early while the failure was only reported much later
  implication: this further supports the diagnosis that early child outcome and late parent-visible reporting are decoupled, which is exactly the failure shape produced by optimistic dispatch plus delayed/coarse observer feedback

## Resolution

root_cause: the current dominant problem is a combination led by polling/notification design, not queue starvation or initial dispatch failure. Async delegation is often launched successfully via `sendPromptAsync()`, but parent visibility relies on (1) a coarse observer that treats child sessions as simply busy until they become idle/retry/deleted or the 30-minute timeout expires, and (2) best-effort parent notifications whose offline fallback only works if the parent session itself exists in continuity. In the latest failing run, two child sessions actually completed and one ran until the observer timeout window, yet the parent transcript stopped after `Delegated task started` reminders because the parent session was not present in continuity, so completion/failure fallback could not be persisted. Secondary contributors are optimistic `ok:true/running` responses before outcome is known and lifecycle truth drift from later event remapping/observation updates.
fix:
verification:
files_changed: []
