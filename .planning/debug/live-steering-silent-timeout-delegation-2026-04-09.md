---
status: investigating
trigger: "Investigate issue: live-steering-silent-timeout-delegation-2026-04-09"
created: 2026-04-09T00:00:00.000Z
updated: 2026-04-09T01:12:00.000Z
---

## Current Focus

hypothesis: the failure is primarily a parent-observability durability bug with structural continuity assumptions: async children are launched and routed correctly, but parent completion/failure visibility is non-durable because start notifications bypass fallback, completion fallback requires a parent continuity record that usually does not exist, and late event remapping can overwrite clearer observer truth
test: verify whether the current codebase structurally records parent sessions, whether fallback can persist without that record, and whether routing/queue evidence contradicts the observability diagnosis
expecting: evidence that routing and queue acquisition succeed while notification durability and lifecycle reconciliation remain the dominant breakpoints
next_action: finalize diagnose-only handoff with refined root cause, eliminated hypotheses, and fix strategies

## Symptoms

expected: background delegation should spawn real child work, remain observable to the parent, survive parent turn boundaries via async session dispatch, progress through queue/lifecycle states coherently, and support live-steering/agent-selection decisions without false success or silent timeout.
actual: delegate-task often returns ok:true / running metadata, but the latest failure packet and recent diagnostics show zero useful output, blind waiting, stream cutoff, background timeouts, queue/poll ambiguity, and likely races between async dispatch, polling, and notification.
errors: false-success pattern; background task not found in earlier runs; no started signal; background polling timed out; session may look idle/deleted/retry without validated output; tool execution aborted in fallback cases.
reproduction: use the supplied docs and current source; trace the exact end-to-end path for async delegation and compare it with the live-steering architecture assumptions.
started: prior diagnosis on 2026-04-09 identified manager split, ownership mismatch, and builtin-process no-op; later post-fix trial still reported 0% success with new timeout / observability / stream-cutoff failure modes; latest failure artifact is fail-silently-timout-session.md.

## Eliminated

- hypothesis: queue starvation or pending-lane backlog is the main cause of the timeout
  evidence: latest failure payloads and continuity records show `concurrency_pending: 0`, queue lanes acquired immediately, and three children launched with active counts 1/2/3 before the parent lost visibility
  timestamp: 2026-04-09T01:10:30.000Z

- hypothesis: specialist routing / agent selection sent work to the wrong agent and caused silent failure
  evidence: the run rejected invalid `explore`, then explicitly rerouted to `researcher`; failure artifacts and persisted route metadata show `effectiveAgent: researcher` and `fallbackUsed: false` for the launched children
  timestamp: 2026-04-09T01:10:45.000Z

- hypothesis: async dispatch itself usually never launches child work
  evidence: current code uses `sendPromptAsync()`, the failing run emitted three started reminders, and continuity shows two launched child sessions later reached `status: completed`
  timestamp: 2026-04-09T01:11:00.000Z

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

- timestamp: 2026-04-09T01:08:00.000Z
  checked: lifecycle-process-runner.ts, lifecycle-background-observer.ts, continuity.ts, lifecycle-manager.ts
  found: started notifications in `runLifecycleSubsessionTask()` call `notifyParentSession()` directly with no offline fallback; completion/failure notifications use `notifyParentWithFallback()`, but that fallback persists via `patchSessionContinuity(parentSessionID, ...)`, which is a no-op when the parent record is absent; `recordSessionContinuity()` is only called for delegated child sessions in `launchDelegatedSession()`
  implication: parent notification durability is structurally unreliable, not just best-effort by accident — the code assumes a persisted parent continuity record that it does not generally create

- timestamp: 2026-04-09T01:10:00.000Z
  checked: fail-silently-timout-session.md, specialist-router.ts, latest continuity entries
  found: the failing run explicitly rerouted the invalid `explore` request to explicit `researcher` sessions with `fallbackUsed: false`, queue lanes were acquired with active counts 1/2/3 and pending 0, and two child sessions later reached `status: completed` in continuity
  implication: agent misrouting and queue starvation do not explain the captured failure; the system launched routed children, but the parent still lost durable outcome visibility

- timestamp: 2026-04-09T01:11:00.000Z
  checked: runtime.ts, lifecycle-manager.ts, continuity record for `ses_28db359feffekvIoDj36pAmy6s`
  found: after observer timeout marks a child failed, later `session.idle` events are folded through `inferContinuityStatusFromEvent()` so status stays `error` while lifecycle observation source becomes `event:session.idle`; lifecycle updates therefore preserve terminal failure status but can overwrite the clearer timeout observation with a later non-terminal-looking signal
  implication: lifecycle truth is not cleanly reconciled, which obscures diagnosis and makes the parent-facing story noisier, but this is secondary to the notification durability gap

## Resolution

root_cause: the dominant current fault is not queueing or routing; it is broken parent observability durability across the async delegation lifecycle. The harness returns optimistic `ok:true`/`running` immediately after queue acquisition and before outcome truth is known. Child sessions are launched correctly via `promptAsync()` and at least some complete, but parent start/completion/failure visibility is non-durable: started notifications bypass offline fallback entirely, completion/failure fallback depends on `patchSessionContinuity(parentSessionID, ...)`, and the codebase only records delegated child sessions in continuity. In the latest run the parent session was absent from continuity, so fallback persistence could not occur and parent-visible updates stopped at `Delegated task started`. The long hang is then amplified by the coarse 30-minute poller, while later event/status remapping can overwrite clearer observer evidence and make the state story look contradictory.
fix:
verification:
files_changed: []
