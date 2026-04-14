---
status: closed
trigger: "Validate merged root cause analysis RC-1 through RC-4 against current codebase"
created: 2026-04-10T00:00:00Z
updated: 2026-04-14T18:04:00Z
resolution: "confirmed, informed Phase 09.2 design"
---

## Current Focus

hypothesis: All 4 root causes validated against current source — ready to report findings
test: Complete — all source files read and traced
expecting: CONFIRMED/PARTIALLY CONFIRMED/REFUTED per RC
next_action: Return structured diagnosis

## Symptoms

expected: Analysis claims RC-1 (architectural lie), RC-2 (observer idle/completed), RC-3 (parent observability), RC-4 (terminology collision)
actual: Validated each against current codebase
errors: N/A — validation pass
reproduction: Source code reading and path tracing
started: 2026-04-10

## Eliminated

## Evidence

### RC-1: Architectural Lie — CONFIRMED (HIGH confidence)

- lifecycle-manager.ts:59-71 — resolveEffectiveExecutionMode() rewrites builtin-process → builtin-subsession with comment "builtin-process never grew beyond a stub"
- lifecycle-manager.ts:363 — launchDelegatedSession() ALWAYS calls runLifecycleSubsessionTask(), NEVER calls runLifecycleProcessTask()
- execution-mode.ts:176-179 — resolveBuiltInMode() selects "builtin-process" for research tasks ("Research task: owned-process stdio is sufficient")
- lifecycle-process-runner.ts:149 — runLifecycleProcessTask() exists and is complete (270 lines) but has NO live callers in src/ (only test callers)
- delegate-task.ts:132 — buildTaskCharacteristics() sets isResearch:true for researcher agent, isHeadless:true for research or background

Summary: classifyExecutionMode() selects builtin-process for research → resolveEffectiveExecutionMode() silently rewrites to builtin-subsession → runLifecycleSubsessionTask() always runs. The process runner is dead code.

### RC-2: Observer Conflates "idle" with "completed" — CONFIRMED (HIGH confidence)

- lifecycle-background-observer.ts:91 — while loop starts IMMEDIATELY, no initial sleep before first poll
- lifecycle-background-observer.ts:136 — `if (statusType === "idle")` immediately marks completed, no seenBusy check
- No `seenBusy` flag exists anywhere in the file (grep confirmed)
- lifecycle-background-observer.ts:31 — DEFAULT_POLL_INTERVAL_MS = 15000 (15 seconds between polls)

Summary: On first poll (~0ms delay), if the child session hasn't started processing yet, it will appear "idle" and the observer marks it "completed" instantly. No mechanism to distinguish "hasn't started yet" from "finished working."

### RC-3: Parent Observability Incomplete — CONFIRMED (HIGH confidence)

- pending-notifications.ts:32-47 — persistPendingNotification() returns undefined if no parent continuity record exists (line 36-39)
- continuity.ts:202 — recordSessionContinuity() is ONLY called at lifecycle-manager.ts:261 — for the CHILD session
- lifecycle-manager.ts — parent continuity is NEVER recorded at delegation time; only patchSessionContinuity for the child
- pending-notifications.ts:67-77 — formatPendingNotificationsForSession() has ZERO runtime call sites in src/ (only its own definition)
- grep confirms: pendingNotifications are WRITTEN (persistPendingNotification called in lifecycle-process-runner.ts and lifecycle-background-observer.ts) but never CONSUMED/displayed to users

Summary: Parent has no continuity record → persistPendingNotification returns undefined → notification lost. Even if persisted, formatPendingNotificationsForSession() is dead code with no caller.

### RC-4: Terminology Collision — CONFIRMED (HIGH confidence)

- delegate-task.ts:231-233 — `run_in_background` described as "When true, returns immediately — continue with other work"
- delegate-task.ts:215 — tool description says "run_in_background=true, returns immediately with task metadata"
- tools/background/index.ts:56-57 — description says "Manage harness background processes by spawning, listing, checking, waiting for, or cancelling tracked tasks"
- background-manager.ts — manages OS-level child processes (spawn, kill, onComplete)
- delegate-task's "background" = async delegation to child OpenCode session
- background tool's "background" = spawning OS child processes

Summary: Two completely different systems both use "background" terminology. delegate-task.run_in_background creates an async child OpenCode session. The background tool spawns OS processes. No documentation clarifies the distinction.

## Resolution

root_cause: All 4 root causes CONFIRMED against current codebase:
  RC-1: resolveEffectiveExecutionMode() at lifecycle-manager.ts:59 silently rewrites builtin-process→builtin-subsession; launchDelegatedSession() at lifecycle-manager.ts:363 always calls runLifecycleSubsessionTask() never runLifecycleProcessTask()
  RC-2: lifecycle-background-observer.ts:136 immediately treats first "idle" poll as "completed" with no seenBusy guard
  RC-3: Parent continuity never recorded (only child at lifecycle-manager.ts:261); pending notifications written but never consumed (formatPendingNotificationsForSession is dead code with no src/ callers)
  RC-4: delegate-task.run_in_background (async child sessions) vs background tool (OS processes) share no relation but use identical terminology

fix: N/A — diagnosis only
verification: Source code reading and grep-based evidence collection
files_changed: []
