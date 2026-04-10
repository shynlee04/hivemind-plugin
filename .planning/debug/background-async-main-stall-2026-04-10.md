---
status: awaiting_human_verify
trigger: "Investigate and fix background delegation regression where parent/main session stalls instead of continuing asynchronously"
created: 2026-04-10T00:00:00Z
updated: 2026-04-10T00:20:00Z
---

## Current Focus

hypothesis: Confirmed and fixed — async launches now return immediately while queue acquisition and dispatch continue in a background promise.
test: Await user verification in the real delegated workflow that previously left the parent session loading for ~20 minutes.
expecting: Parent/main session stays responsive immediately after launching queued background work, with lifecycle metadata showing queued/running progress instead of a stuck tool call.
next_action: Ask the user to rerun the real workflow and confirm the parent remains usable while delegated work continues asynchronously.

## Symptoms

expected: Background delegated work runs asynchronously; the main session remains responsive and can continue other work; the user can observe what is happening.
actual: Parent/main session stalls, appears queued/loading, and may not return even after ~20 minutes.
errors: No explicit error text provided yet; likely silent failure or observability gap.
reproduction: Use the existing GSD command/delegation flow that records and tracks background work. Treat this as reproducible via current harness background/delegation path.
started: Sticky ongoing bug from recent debug sessions on 2026-04-09/2026-04-10.

## Eliminated

## Evidence

- timestamp: 2026-04-10T00:02:00Z
  checked: prior debug files, knowledge base, and current lifecycle/delegate runtime
  found: prior RC-2/RC-3 fixes addressed false-success and parent-shell regressions, but none changed the async launch control flow that returns tool output to the caller.
  implication: the current parent stall is likely a different seam than the previously fixed false-completion bug.

- timestamp: 2026-04-10T00:04:00Z
  checked: src/tools/delegate-task.ts and src/lib/lifecycle-manager.ts
  found: delegate-task always awaits lifecycleManager.launchDelegatedSession(); launchDelegatedSession always calls enqueueWaitingLifecycle() and then `await acquireLifecycleQueue(...)` before it decides between async/sync execution paths or returns any JSON.
  implication: queued async launches block in the parent tool call until a lane is acquired, so `run_in_background=true` is not truly asynchronous when concurrency is saturated.

- timestamp: 2026-04-10T00:05:00Z
  checked: src/lib/lifecycle-process-runner.ts
  found: once the async path reaches runLifecycleSubsessionTask(), it uses fire-and-forget `sendPromptAsync(...).then(...)` plus `void observeBackgroundCompletion(...)` and immediately returns JSON. The major blocking behavior is before this function, not inside it.
  implication: the main stall mechanism is queue waiting in lifecycle-manager, not promptAsync itself.

- timestamp: 2026-04-10T00:11:00Z
  checked: focused vitest regression `tests/lib/lifecycle-manager.test.ts -t "returns immediately for async launches even when the task is still queued"`
  found: the new test fails because `secondSettled` remains false after flush while the second async launch is queued behind a held lane.
  implication: root cause confirmed by executable evidence — queued async launches do not return immediately to the parent.

## Resolution

root_cause: launchDelegatedSession awaits acquireLifecycleQueue() for both sync and async runs. When runInBackground=true and the lane is full, the parent tool call blocks on queue acquisition instead of returning immediately with queued task metadata.
fix: launchDelegatedSession now branches for runInBackground=true before awaiting queue acquisition. Async launches schedule queue acquisition + dispatch in a background promise, patch lifecycle on failure, and return immediate async metadata to the parent even while the task is still queued. Added a regression test proving queued async launches return immediately, and aligned the v3 integration fixture with the real delegated-session continuity shape.
verification: |
  - RED: `npx vitest run tests/lib/lifecycle-manager.test.ts -t "returns immediately for async launches even when the task is still queued"` failed with `expected false to be true`, proving queued async launches stayed pending.
  - GREEN: reran the same command after the fix and it passed.
  - Regression suite: `npx vitest run tests/lib/lifecycle-manager.test.ts tests/lib/lifecycle-background-observer.test.ts tests/tools/delegate-task.test.ts tests/hooks/create-core-hooks.test.ts tests/integration/v3-e2e.test.ts` → 56/56 tests passed.
  - Typecheck: `npm run typecheck` passed.
files_changed:
  - src/lib/lifecycle-manager.ts
  - tests/lib/lifecycle-manager.test.ts
  - tests/integration/v3-e2e.test.ts
