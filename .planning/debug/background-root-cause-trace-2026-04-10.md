---
status: investigating
trigger: "background root cause trace — parent observability, run_in_background selection, and background tool ambiguity"
created: "2026-04-10T00:00:00.000Z"
updated: "2026-04-10T00:00:00.000Z"
---

## Current Focus

hypothesis: The reported failure family is a layered design mismatch, not one isolated defect. The current runtime advertises multiple background execution modes, but live delegation always executes through the child-session async path. That path still has an `idle => completed` observer flaw and a weak parent-delivery contract. Separately, the `run_in_background` boolean and the standalone `background` tool reuse the same language for different systems, which encourages wrong operator assumptions and wrong agent choices.
test: Trace the reported transcript, current execution-selection logic, live launcher, observer semantics, notification persistence, and test expectations.
expecting: Evidence that the reported transcript is on the async child-session path, not the owned-process path; that parent visibility can still fail or become misleading; and that the runtime/documentation/test surface currently encodes contradictory background semantics.
next_action: Finalize diagnose-only handoff with ranked root causes and fix strategies.

## Symptoms

expected: `delegate-task` background work should choose the intended execution mode, remain observable to the parent, only report success after verified completion, and have unambiguous semantics distinct from the standalone `background` tool.
actual: transcripted calls from `session-ses_28b9+WTF_WRONG.md` line 3899 onward return immediate async success envelopes with queue and lifecycle metadata, but existing reports show either silent/late parent visibility or false-success completion. The user also reports confusion around `run_in_background` true/false choice and the separate harness `background` tool.
errors: false success, no useful parent observability, no durable queue-to-result story, misleading background terminology, and contradictory runtime/test expectations.
reproduction: use the transcript plus current source and tests listed below.
started: failures documented on 2026-04-09 and 2026-04-10; some fixes landed, but the current code still preserves deeper design mismatches.

## Confirmed Facts

- The exact transcripted calls at `session-ses_28b9+WTF_WRONG.md:3902` and `session-ses_28b9+WTF_WRONG.md:3965` used `delegate-task` with `run_in_background: true` and returned immediate async success envelopes with `lifecycle.phase: "running"` and `observation.detail: "prompt-dispatched-async"`.

- The delegate tool still classifies research/headless work as `builtin-process`, but that is only a classification artifact. `buildTaskCharacteristics()` marks research tasks as `isResearch: true`, `isHeadless: true`, and `runInBackground: args.run_in_background`, and `classifyExecutionMode()` therefore selects `builtin-process` for those cases. See [src/tools/delegate-task.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/tools/delegate-task.ts#L128) and [src/lib/execution-mode.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/execution-mode.ts#L158).

- The live lifecycle manager immediately rewrites any `builtin-process` choice to `builtin-subsession`. `resolveEffectiveExecutionMode()` replaces `builtin-process` with `builtin-subsession`, and `launchDelegatedSession()` always calls `runLifecycleSubsessionTask()` afterward. There is no branch in `launchDelegatedSession()` that calls `runLifecycleProcessTask()`. See [src/lib/lifecycle-manager.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/lifecycle-manager.ts#L59), [src/lib/lifecycle-manager.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/lifecycle-manager.ts#L219), and [src/lib/lifecycle-manager.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/lifecycle-manager.ts#L363).

- Because of that rewrite, the transcripted failures are on the async child-session path, not the owned-process path. The owned-process runner exists in [src/lib/lifecycle-process-runner.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/lifecycle-process-runner.ts#L149), but it is effectively disconnected from normal delegation launch.

- The async child-session path still starts background observation immediately after `promptAsync()` is dispatched. `runLifecycleSubsessionTask()` calls `sendPromptAsync(...).then(...)` and independently kicks off `observeBackgroundCompletion(...)` without an initial synchronization barrier or proof that the child ever entered a busy state. See [src/lib/lifecycle-process-runner.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/lifecycle-process-runner.ts#L297) and [src/lib/lifecycle-process-runner.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/lifecycle-process-runner.ts#L348).

- The observer still treats `statusType === "idle"` as terminal completion. The first polling loop iteration performs a status lookup before any sleep, and if the child is idle it marks the task completed immediately. There is no `seenBusy` or other proof-of-execution guard. See [src/lib/lifecycle-background-observer.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/lifecycle-background-observer.ts#L90), [src/lib/lifecycle-background-observer.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/lifecycle-background-observer.ts#L135), and [src/lib/lifecycle-background-observer.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/lifecycle-background-observer.ts#L187).

- The tests currently encode and reinforce that `idle => completed` assumption instead of protecting against it. The observer tests explicitly expect completion once the child becomes idle, but there is no test for the critical case "first poll sees idle before any prior busy state". See [tests/lib/lifecycle-background-observer.test.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/tests/lib/lifecycle-background-observer.test.ts#L107) and [tests/lib/lifecycle-background-observer.test.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/tests/lib/lifecycle-background-observer.test.ts#L286).

- Parent notification fallback remains structurally incomplete. `persistPendingNotification()` only works if the parent already has a continuity record; otherwise it returns `undefined` and drops the notification. See [src/lib/pending-notifications.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/pending-notifications.ts#L32).

- Parent sessions are not generally recorded in continuity by the lifecycle launch path. The only direct runtime caller of `recordSessionContinuity()` in `src/` is the child-session record written inside `launchDelegatedSession()`. See [src/lib/lifecycle-manager.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/lifecycle-manager.ts#L261) and [src/lib/continuity.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/continuity.ts#L202).

- Even when pending notifications are persisted, the current codebase does not show a live consumer that surfaces them back into resumed parent sessions. `formatPendingNotificationsForSession()` exists, but no runtime call site uses it. Search results only show the definition and storage plumbing, not delivery wiring. See [src/lib/pending-notifications.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/pending-notifications.ts#L67).

- The standalone `background` tool is a different system entirely. It manages owned OS subprocesses via `BackgroundManager.spawn/list/status/cancel/wait`, scoped to the caller session. It is not the same as `delegate-task` async child-session execution, even though both surfaces use the word "background". See [src/tools/background/index.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/tools/background/index.ts#L55).

- The tests also encode a contradictory architecture story: classifier tests assert research/headless resolves to `builtin-process`, while lifecycle tests assert that same choice is immediately rewritten to `builtin-subsession`. See [tests/lib/execution-mode.test.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/tests/lib/execution-mode.test.ts#L102) and [tests/lib/background-manager-harden.test.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/tests/lib/background-manager-harden.test.ts#L317).

## Root Causes

### 1. Primary root cause: runtime selection and runtime execution are no longer the same system

The codebase still presents three background concepts as if they are live and distinct: classifier-selected `builtin-process`, classifier-selected `builtin-subsession`, and the standalone `background` tool. In reality, the lifecycle manager collapses `builtin-process` into `builtin-subsession` before launch. That means the route metadata, tests, and operator expectations describe one execution shape while the actual runtime executes another. This is the highest-severity issue because it poisons every subsequent diagnosis: users and future maintainers think they are debugging process-backed background work, but the live path is a session-backed poller.

Evidence:
- [src/lib/lifecycle-manager.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/lifecycle-manager.ts#L59)
- [src/lib/lifecycle-manager.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/lifecycle-manager.ts#L363)
- [tests/lib/execution-mode.test.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/tests/lib/execution-mode.test.ts#L109)
- [tests/lib/background-manager-harden.test.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/tests/lib/background-manager-harden.test.ts#L318)

### 2. Direct execution bug: the async child-session observer has no proof that work actually started

`runLifecycleSubsessionTask()` dispatches `promptAsync()` and starts polling immediately. The observer then interprets `idle` as completed without verifying the child ever transitioned through `busy`. On a platform whose coarse status model is `idle | busy | retry`, that is insufficient: "idle" can mean "not yet started" as easily as "done". This is the strongest explanation for instant false-success cases.

Evidence:
- [src/lib/lifecycle-process-runner.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/lifecycle-process-runner.ts#L301)
- [src/lib/lifecycle-process-runner.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/lifecycle-process-runner.ts#L348)
- [src/lib/lifecycle-background-observer.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/lifecycle-background-observer.ts#L91)
- [src/lib/lifecycle-background-observer.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/lifecycle-background-observer.ts#L135)

### 3. Parent observability is still not durable enough to be trusted

The system can attempt real-time parent reminders and can attempt offline persistence, but the offline path depends on a parent continuity record that often does not exist. On top of that, persisted pending notifications have no confirmed read-side surfacing path in the current runtime. So parent observability is not a durable contract; it is best effort plus a partially disconnected fallback.

Evidence:
- [src/lib/pending-notifications.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/pending-notifications.ts#L32)
- [src/lib/continuity.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/continuity.ts#L177)
- [src/lib/lifecycle-manager.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/lifecycle-manager.ts#L261)
- [src/lib/pending-notifications.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/lib/pending-notifications.ts#L67)

### 4. Semantic design bug: `run_in_background` means "return immediately", not "use the background tool", but the product surface does not make that distinction clear

`delegate-task` describes `run_in_background` only in terms of response timing, not in terms of which execution family/submode it actually triggers or when it is appropriate. Meanwhile, the project separately exposes a `background` tool for OS subprocesses. That language collision makes it too easy for an agent or human to believe they are selecting one background system when they are actually selecting another.

Evidence:
- [src/tools/delegate-task.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/tools/delegate-task.ts#L215)
- [src/tools/background/index.ts](/Users/apple/hivemind-plugin/.worktrees/harness-experiment/src/tools/background/index.ts#L55)

## Execution Path For The Reported Transcript

1. `delegate-task` receives `run_in_background: true` and route metadata shows the chosen specialist.
2. The classifier may describe the request as `builtin-process` when it looks research-like.
3. The lifecycle manager rewrites that to `builtin-subsession`.
4. A child OpenCode session is created and continuity is recorded for the child only.
5. `promptAsync()` is fired.
6. Parent "started" notification is attempted best-effort.
7. Poll-based observer starts immediately.
8. If the child appears idle on the first or early poll, the observer can mark it completed and emit a success notification.
9. If delivery to the parent fails, persistence only works when a parent continuity record exists.
10. Even persisted pending notifications lack a confirmed read-side delivery path.

## Inferences

- The exact transcripted false-success instances are most likely the async child-session observer path, not the owned-process path, because the current launcher never takes the owned-process branch for normal delegation.

- The persistent "not observable by parent" symptom is likely a combination of two issues rather than one: real-time delivery is best effort, and offline durability depends on parent continuity coverage plus a missing or incomplete replay path.

- The user’s confusion around `run_in_background` and the standalone `background` tool is not operator error; it is a product-language problem caused by exposing two different mechanisms with overlapping labels and contradictory runtime/test narratives.

## Fix Strategies

### Option 1. Make the architecture honest: choose one real background mechanism for delegated work and remove the fake branch

Either fully wire `builtin-process` into the real launcher or stop advertising it in classifier/test/tool narratives until it is actually live. If child-session async delegation is the intended path, then remove or quarantine the `builtin-process` branch from `delegate-task` runtime selection and related tests. If owned-process is the intended path for research/headless work, then actually call `runLifecycleProcessTask()` from `launchDelegatedSession()`.

Pros: removes the largest source of confusion and diagnostic misdirection; aligns runtime, metadata, docs, and tests.
Cons: larger refactor than a tactical patch; requires deliberate product choice.

### Option 2. Keep the current async child-session path, but harden its completion contract

Add a proof-of-execution gate before treating `idle` as completion. Minimum guardrails:
- require at least one observed `busy` state, or
- require message-count growth beyond the initial prompt, or
- require an initial grace delay before the first poll plus a second signal.

Pros: directly addresses the false-success bug on the live path with limited blast radius.
Cons: does not fix the architectural lie that `builtin-process` appears selectable but is not live; does not fully solve parent replay durability by itself.

### Option 3. Repair parent durability and replay independently of execution-mode work

Create continuity records for eligible parent sessions, make offline notification persistence guaranteed for delegated children, and add an actual replay/surfacing hook for `pendingNotifications`.

Pros: directly addresses the "not observable by parent" complaint and helps even after other failures.
Cons: if left alone, it can faithfully deliver wrong completion signals generated by the weak observer, so it improves visibility without guaranteeing correctness.

## Best Option

Option 1 is the best systemic fix because the biggest failure here is architectural dishonesty: the codebase, tests, and operator surface say there are multiple live background backends, but the runtime has already collapsed them into one. That mismatch is what keeps producing contradictory explanations, conflicting artifacts, and wrong debugging assumptions. Once the system honestly exposes one real execution path, the remaining bugs become much easier to isolate and test.

Option 2 is the best tactical fix if you need the smallest immediate runtime correction. It addresses the most dangerous live false-success behavior on the current async path and likely resolves the "completed in milliseconds with no work" class of failures. It is weaker than Option 1 because it leaves the product and tests lying about execution-mode semantics. Option 3 is necessary, but not sufficient alone, because durable delivery of a wrong status is still a wrong status.

## Open Questions

- Is there any runtime hook outside `src/` that replays `pendingNotifications` into parent sessions? Current source search did not reveal one.
- Was the product intent to permanently abandon owned-process delegation, or is the fallback in `resolveEffectiveExecutionMode()` meant to be temporary but never cleaned up?
- Do current user-visible failures include both "instant false completion" and "long timeout then blind parent" in the same build, or are those observed on different revisions/configurations of the async child-session path?
