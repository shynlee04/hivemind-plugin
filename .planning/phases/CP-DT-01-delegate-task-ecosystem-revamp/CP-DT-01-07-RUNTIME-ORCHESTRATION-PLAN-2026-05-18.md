---
phase: CP-DT-01
wave: 7
artifact: plan
date: 2026-05-18
status: ready-for-authorization
requires_user_authorization_before_code: true
---

# CP-DT-01 Wave 7 Plan — Runtime Orchestration

## Route

Framework route: GSD remediation cycle.

Execution shape: sequential batches, max 2 subagents at once, with gate checks after each batch.

Primary artifacts:

- `CP-DT-01-07-RUNTIME-ORCHESTRATION-CONTEXT-2026-05-18.md`
- `CP-DT-01-07-RUNTIME-ORCHESTRATION-RESEARCH-2026-05-18.md`
- `CP-DT-01-07-RUNTIME-ORCHESTRATION-SPEC-2026-05-18.md`
- `CP-DT-01-07-RUNTIME-ORCHESTRATION-PLAN-2026-05-18.md`

## Batch 0 — Authorization and baseline

Goal: lock scope before code edits.

Steps:

- Confirm this Wave 7 plan is the active remediation plan.
- Capture dirty worktree status and avoid touching unrelated files.
- Re-run focused baseline tests that currently pass for Wave 6.
- Record known full-suite unrelated failures separately.

Exit gate:

- User authorizes implementation or asks to revise spec/plan.
- Baseline test state recorded.

## Batch 1 — Execution signal collector

Goal: make `promptAsync accepted` distinct from actual execution.

Target surfaces:

- `src/coordination/delegation/`
- `src/shared/session-api.ts`
- tests under `tests/lib/coordination/delegation/` and `tests/tools/delegation/`

Work contract:

- Add a small collector/adapter that records first action/message/tool signal.
- Persist `executionState`, `firstActionAt`, `signalSource`, and action/message counters in delegation state.
- Write RED tests proving accepted dispatch is not execution proof.

Exit gate:

- REQ-07-01 tests pass.
- Typecheck passes for touched modules.

## Batch 2 — Polling, escalation, and parent notification

Goal: wire cadence and parent delivery.

Target surfaces:

- `src/coordination/delegation/monitor.ts`
- notification/router modules if present
- `src/shared/session-api.ts` or new TUI adapter
- `.hivemind/state` persistence seam tests

Work contract:

- Implement cadence 30/45/60/90/120/180.
- Implement thresholds 60/120/180/300/600.
- Use `tui.appendPrompt` and `tui.showToast` via wrapper.
- Persist pending notifications when immediate delivery is unavailable.

Exit gate:

- REQ-07-02, REQ-07-03, REQ-07-08 unit/integration tests pass.
- No `.opencode/` state writes.

## Batch 3 — Result extraction and completion truth

Goal: completed delegation must produce useful parent result.

Target surfaces:

- `src/coordination/delegation/`
- `src/tools/delegation/delegation-status.ts`
- `src/shared/tool-response.ts` if response envelope needs extension

Work contract:

- Extract final assistant message excerpt where available.
- Include child session ID, signals, evidence level, and summary in status/result.
- Prevent status-only completion from being labeled high-confidence.

Exit gate:

- REQ-07-04 tests pass.
- Existing delegate-task tests still pass.

## Batch 4 — Control, resume, slots, and primitive discovery

Goal: close user-facing control and agent validation gaps.

Target surfaces:

- `src/tools/delegation/delegation-status.ts`
- `src/coordination/delegation/manager.ts`
- `src/coordination/delegation/slot-manager.ts`
- primitive discovery helpers

Work contract:

- Add `get` alias or compatibility handling for single status lookup.
- Add/verify continue/resume completed task by `childSessionId`.
- Test 10 slots per parent and independent parent pools.
- Extend discovery to project/global OpenCode primitive scopes with clear error messages.

Exit gate:

- REQ-07-05, REQ-07-06, REQ-07-07 tests pass.

## Batch 5 — Cleanup and lifecycle gates

Goal: remove confusing overlap and verify architecture compliance.

Work contract:

- Audit `manager-runtime.ts`, `sdk-delegation/handler.ts`, notification router, pending dispatch state.
- Keep canonical path explicit: tool -> coordinator -> dispatcher/starter -> monitor -> notification/status.
- Run lifecycle/spec/evidence gate review.

Exit gate:

- REQ-07-09 tests or documented proof pass.
- Focused test suite passes.
- `npm run typecheck` passes.

## Batch 6 — Runtime UAT

Goal: prove OpenCode runtime behavior, not only mocked tests.

UAT script:

- Dispatch `delegate-task` to a child session that must run at least one visible tool/action.
- Capture `delegationId` and `childSessionId`.
- Observe first-action signal inside 60s.
- Observe parent progress injection and TUI toast.
- Let child complete and observe result delivery after parent endstream or next turn.
- Run one control/resume flow against completed child session.

Exit gate:

- L1 proof artifact added under CP-DT-01 phase folder.
- If L1 cannot run in current environment, record exact blocker and do not mark CP-DT-01 complete.

## Verification commands

Focused verification:

```bash
npx vitest run tests/tools/delegation/delegate-task-v2.test.ts tests/tools/delegation/delegate-task-e2e.test.ts tests/tools/delegation/delegation-status-v2.test.ts tests/tools/delegate-task.test.ts tests/integration/delegation-v2-integration.test.ts --reporter=verbose
npx vitest run tests/lib/coordination/delegation/coordinator.test.ts tests/lib/coordination/delegation/full-pipeline.test.ts tests/lib/coordination/delegation/manager-decomposition.test.ts --reporter=verbose
npm run typecheck
```

Full verification:

```bash
npm test
```

If full verification fails outside CP-DT-01 surfaces, record exact unrelated failure and do not hide it.

## Risks

- SDK event stream may not expose enough child tool/action detail; fallback polling/message inspection must exist.
- TUI append/toast may be unavailable in non-TUI contexts; pending notification persistence must be the fallback.
- Full test suite currently has unrelated failures; completion claim must be scoped honestly.
- Too much cleanup in same batch can increase regression risk; keep cleanup after behavior slices pass.

## Authorization point

Do not begin Batch 1 code implementation until this plan is accepted or revised. The next safe action is either user authorization to implement Wave 7 or user-requested edits to this spec/plan.
