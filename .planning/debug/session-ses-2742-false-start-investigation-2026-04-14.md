---
status: closed
trigger: "/gsd-debug Investigate session-ses_2742.md and stop the wrong background-delegation interpretation."
created: 2026-04-14T00:00:00Z
updated: 2026-04-14T13:10:00Z
---

## Current Focus

hypothesis: The async delegation path still promotes children to `running` and emits `started` notifications from queue acquisition / promptAsync acknowledgement, while true start-gate evidence is only enforced later by completion modules. This creates false starts, poisoned status propagation, and 30-minute timeout cases for sessions that never truly began work.
test: Quarantine planning artifacts that claim start/completion truth, then patch async lifecycle so children stay non-started until observer-confirmed assistant/tool evidence promotes them to `running`.
expecting: Evidence that lifecycle-dispatcher and runLifecycleSubsessionTask currently report `running`/`started` before start-gate passes, while phase docs 09/09.1/09.2 claim those semantics are already fixed.
next_action: Quarantine contaminated phase artifacts, then patch lifecycle-dispatcher + lifecycle-background-observer + lifecycle-process-runner and run targeted tests.

## Symptoms

expected: a session should only be marked started after first assistant output/tool activity and status should reflect real runtime truth
actual: false starts, false success/failure timing, wrong status propagation, and contaminated phase assumptions
errors: logical/runtime false-start semantics; 30-minute failure behavior tied to non-started sessions
reproduction: inspect the referenced session and phase/debug artifacts; compare runtime assumptions against actual start semantics
started: current forensic reset context dated 2026-04-14, with earlier background/delegation debug docs from 2026-04-09 to 2026-04-10

## Eliminated

## Evidence

- timestamp: 2026-04-14T00:00:00Z
  checked: session-ses_2742.md and referenced forensic/debug artifacts
  found: The routed /do session dispatched three async critic tasks in parallel, treated `session-created`/system reminders as proof of start, and ignored the single-session-start constraint described by the current investigation.
  implication: The current understanding of “started” is contaminated by dispatch metadata rather than real child execution.

- timestamp: 2026-04-14T00:10:00Z
  checked: src/lib/lifecycle-dispatcher.ts
  found: Async launch patches lifecycle to `status: "running"` at lane acquisition (`phase: "dispatching"`) and again at `detail: "prompt-dispatched-async"` before any assistant output or tool activity exists.
  implication: Runtime status claims child work is running before the start gate is proven.

- timestamp: 2026-04-14T00:12:00Z
  checked: src/lib/lifecycle-process-runner.ts and src/lib/tasking/completion/start-gate.ts
  found: `runLifecycleSubsessionTask()` sends a `started` parent notification immediately after `promptAsync()` resolves, but the actual start gate requires assistant reasoning plus at least two tool calls.
  implication: Parent-visible `started` is emitted from transport acknowledgement, not real child execution.

- timestamp: 2026-04-14T00:15:00Z
  checked: src/lib/lifecycle-background-observer.ts and src/lib/tasking/completion/completion-verifier.ts
  found: Completion logic now enforces assistant-only evidence and two idle polls, but it never owns the promotion from "not started yet" to `running`; it assumes earlier code already set truthful runtime state.
  implication: Phase 09.1/09.2 fixed completion checks more than start semantics, leaving false-start status propagation alive.

- timestamp: 2026-04-14T00:18:00Z
  checked: .planning/phases/09-sticky-delegation-corrective/09-01-SUMMARY.md, .planning/phases/09.1-critical-bug-fixes-test-rewrites/09.1-VERIFICATION.md, .planning/phases/09.2-completion-detection-architecture/09.2-02-SUMMARY.md, .planning/phases/09.2-completion-detection-architecture/09.2-03-SUMMARY.md
  found: These artifacts claim stable completion/start semantics are verified or complete, but the live runtime still reports `running`/`started` before start-gate proof.
  implication: These artifacts are contaminated and must be quarantined from future planning until runtime semantics are corrected.

## Resolution

root_cause: Async builtin-subsession launches treated queue acquisition and `promptAsync()` acknowledgement as proof of start, so lifecycle state and parent-visible notifications reported `running`/`started` before the D-10 start gate had actually passed.
fix: Phase 12 Plan 01 moved builtin-subsession start promotion under observer ownership, kept children in truthful pre-start phases until real start-gate evidence existed, and preserved visible-worker immediate start only where real worker spawn itself is the honest execution signal. Phase 12 Plan 02 then quarantined contaminated 09.2 summaries and reconciled planning metadata.
verification: `12-01-SUMMARY.md` records targeted regression coverage and truthful start-state commits `257af50c` / `91f7d2ac`; `12-reconciliation-note-2026-04-14.md` records which planning artifacts were superseded after the repair.
files_changed:
  - src/lib/lifecycle-background-observer.ts
  - src/lib/lifecycle-dispatcher.ts
  - src/lib/lifecycle-process-runner.ts
  - src/lib/lifecycle-state.ts
  - tests/lib/delegate-task.test.ts
  - tests/lib/lifecycle-background-observer.test.ts
  - tests/lib/lifecycle-process-runner.test.ts
