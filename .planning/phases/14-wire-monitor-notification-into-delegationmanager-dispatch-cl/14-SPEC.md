# Phase 14: Wire Monitor/Notification into DelegationManager.dispatch + Clean Up Partial Edits — Specification

**Created:** 2026-05-19
**Ambiguity score:** 0.16 (gate: ≤ 0.20)
**Requirements:** 8 locked

## Goal

Replace manual polling with automatic progressive monitoring in `DelegationManager.dispatch()`, wire failure checkpoint detection (60→120→180→300s), implement TUI notification delivery to parent sessions, add delegation control tools (abort/cancel/restart/resume/chain), and remove all deprecated `category`/`safetyCeiling` code from source and tests.

## Background

Session `ses_1c44` proved delegation dispatch works but lacks monitoring — child sessions run with no status feedback to parent. Session `ses_1c50` confirmed TUI notification is missing on completion. Current `escalation-timer.ts` implements escalating warnings (WARN→NUDGE→ALERT→TERMINATE) which is fundamentally wrong — the requirement is failure checkpoint detection based on action count comparison between checkpoints.

Partial edits already exist in `manager-runtime.ts`, `manager.ts`, `types.ts`, and `plugin.ts` from previous sessions but were not verified or committed. The `category-gates.ts` and `category-gate-audit.ts` files still exist but are no longer imported. 29 test files contain deprecated `category`/`safetyCeiling` references.

The design of Wave B2 and B3 in the CP-DT-01-08 plan is marked as "HOÀN TOÀN SAI" and needs complete redesign based on the architecture documented in `CP-DT-01-08-WAVE-B3-REDESIGN-2026-05-19.md`.

## Requirements

1. **Automatic Progressive Polling**: Replace manual polling with `DelegationMonitor.start()` wired into `DelegationManager.dispatch()`.
   - Current: `monitor.start()` is NOT called in `DelegationManager.dispatch()`; partial wiring exists but unverified.
   - Target: After `sendPromptAsync()` succeeds, call `monitor.start(delegationId, parentSessionId)` which polls at 30→45→60→90→120→180s cadence, injecting thin-line status updates.
   - Acceptance: Live test shows 6 status injections appear in parent session context at correct intervals; `npm test` passes for monitor-related tests.

2. **Failure Checkpoint Detection**: Implement action-count-based failure detection at 60→120→180→300s.
   - Current: `escalation-timer.ts` uses escalating warnings (WARN→NUDGE→ALERT→TERMINATE) — wrong design.
   - Target: At each checkpoint, compare `actionCount` to previous checkpoint. If unchanged → increment failure level. At level 4 (300s), stop all injections.
   - Acceptance: Test verifies: (a) action count unchanged at 60s → failure level 1, (b) unchanged at 120s → level 2, (c) unchanged at 180s → level 3, (d) unchanged at 300s → level 4 + injection stopped.

3. **TUI Notification Delivery**: Route completion/failure notifications to parent session via `NotificationRouter`.
   - Current: `notificationRouter.register()` is NOT called in dispatch path; no TUI append on completion.
   - Target: Call `notificationRouter.register(delegationId, parentSessionId)` after delegation registration. On completion, route notification with `<system_reminder>` block appended to parent session prompt.
   - Acceptance: Live test: delegate-task completes → parent session receives system notification with delegation ID, elapsed time, tool count, agent name, and result summary.

4. **Completion Detection**: Detect delegation completion when 3 conditions are met.
   - Current: No completion detector wired into `DelegationManager` dispatch path.
   - Target: Completion = (1) tools running >1 minute, (2) assistant last message exists, (3) file changes detected (if task involves file mutation). Use `session.messages()` to parse `Message[]` and `Part[]`.
   - Acceptance: Test verifies: completion NOT detected before 60s of tool activity; completion detected when all 3 conditions met; completion NOT detected if assistant message missing.

5. **Delegation Control Tools**: Add tools for abort/cancel/restart/resume/chain operations.
   - Current: No control tools exist for managing active delegations.
   - Target: Tools accept `delegationId` and action: `abort` (terminate immediately), `cancel` (graceful stop), `restart` (re-dispatch with same params), `resume` (continue existing session with simple prompt), `chain` (append new task to completed delegation's session).
   - Acceptance: Each control action returns `DelegationResult` with correct terminal status; `resume` preserves session context; `chain` appends to existing child session.

6. **Session Slot Management**: Support up to 10 concurrent delegation slots per main session.
   - Current: Concurrency queue exists but not scoped per parent session.
   - Target: Track active delegations per `parentSessionId`; reject dispatch when 10 slots active for that session. Route notifications to correct parent session.
   - Acceptance: 11th dispatch to same parent session returns error "Max 10 concurrent delegations per session"; notifications appear only in owning parent session.

7. **Remove Deprecated Category/SafetyCeiling Code**: Clean up all `category`/`safetyCeiling`/`classifications` references.
   - Current: 33 source files + 29 test files contain deprecated refs; `category-gates.ts` and `category-gate-audit.ts` exist but unused.
   - Target: Delete 2 files. Remove all refs from source (0 remaining). Update all test files (0 deprecated refs remaining).
   - Acceptance: `grep -r 'category\|safetyCeiling\|classifications' src/` returns 0 matches. `npm run typecheck` clean. `npm test` passes (or only pre-existing failures).

8. **OpenCode SDK/API Research**: Validate all designs against actual OpenCode SDK capabilities.
   - Current: Designs based on assumptions, not validated against SDK v1.14.44+.
   - Target: Research `session.messages()`, `sendPromptAsync()`, `session.promptAsync()`, tool observation hooks, TUI append API, agent permission inheritance. Document findings in RESEARCH.md.
   - Acceptance: RESEARCH.md contains validated API signatures with source links; each requirement maps to confirmed SDK capability or documented limitation.

## Boundaries

**In scope:**
- Wire `DelegationMonitor` and `NotificationRouter` into `DelegationManager.dispatch()`
- Redesign `escalation-timer.ts` for action-count-based failure checkpoints
- Implement completion detection with 3 conditions
- Add delegation control tools (abort/cancel/restart/resume/chain)
- Session slot management (10 per parent session)
- Remove all `category`/`safetyCeiling`/`classifications` code from `src/` and `tests/`
- Research and validate against OpenCode SDK/API
- Update tests to reflect new behavior

**Out of scope:**
- PTY/background-command delegation — belongs to CP-PTY phases
- Native Task tool replacement — delegate-task wraps native Task, does not replace it
- Category gate system — already removed, not reinstating
- Sidecar/dashboard UI — belongs to Q2 sidecar phase
- Cross-session delegation chaining across different parent sessions — only same-parent chain supported

## Constraints

- All modules must stay under 500 LOC cap
- `npm run typecheck` must be clean after each wave
- No `any` types in new code
- TypeScript strict mode with `verbatimModuleSyntax`
- TUI notifications must use `<system_reminder>` format for OpenCode compatibility
- Failure checkpoint injection stops after level 4 (300s) — no further context pollution
- Resume/chain must preserve existing session context — no context loss

## Acceptance Criteria

- [ ] `monitor.start()` called in `DelegationManager.dispatch()` after successful `sendPromptAsync()`
- [ ] `notificationRouter.register()` called after delegation registration
- [ ] 6 progressive polling injections appear at 30→45→60→90→120→180s intervals
- [ ] Failure checkpoint detection works at 60→120→180→300s based on action count comparison
- [ ] Injection stops after failure level 4 (300s)
- [ ] Completion detected when tools >1min + assistant message + file changes
- [ ] TUI notification appended to parent session on completion/failure
- [ ] Control tools (abort/cancel/restart/resume/chain) functional and tested
- [ ] 10 concurrent delegation slots per parent session enforced
- [ ] Zero `category`/`safetyCeiling`/`classifications` refs in `src/`
- [ ] Zero deprecated refs in `tests/` (or only pre-existing failures)
- [ ] `npm run typecheck` clean
- [ ] RESEARCH.md with validated OpenCode SDK API signatures

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                              |
|--------------------|-------|------|--------|------------------------------------|
| Goal Clarity       | 0.90  | 0.75 | ✓      | Specific, measurable outcomes      |
| Boundary Clarity   | 0.85  | 0.70 | ✓      | Explicit in/out scope lists        |
| Constraint Clarity | 0.80  | 0.65 | ✓      | LOC cap, strict mode, SDK limits   |
| Acceptance Criteria| 0.75  | 0.70 | ✓      | 13 pass/fail criteria              |
| **Ambiguity**      | 0.16  | ≤0.20| ✓      |                                    |

## Interview Log

| Round | Perspective    | Question summary              | Decision locked                    |
|-------|----------------|-------------------------------|------------------------------------|
| 1     | Researcher     | What exists in codebase?      | Partial wiring exists, unverified; escalation-timer design wrong; 29 test files have deprecated refs |
| 2     | Simplifier     | Minimum viable scope?         | Wire monitor + notification + remove deprecated code; control tools can be incremental |
| 3     | Boundary Keeper| What's NOT this phase?        | PTY delegation, native Task replacement, cross-session chaining excluded |
| 4     | Failure Analyst| What goes wrong if spec wrong?| Wrong SDK assumptions → runtime failures; must validate all APIs against actual OpenCode source |
| 5     | Seed Closer    | Remaining ambiguity?          | SDK API signatures need live validation — flagged as Requirement 8 with RESEARCH.md deliverable |

---

*Phase: 14-wire-monitor-notification-into-delegationmanager-dispatch-cl*
*Spec created: 2026-05-19*
*Next step: /gsd-discuss-phase 14 — implementation decisions (how to wire monitor, redesign escalation-timer, implement control tools)*
