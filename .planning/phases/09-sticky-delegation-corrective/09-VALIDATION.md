---
phase: 09
slug: sticky-delegation-corrective
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-10
validated: 2026-04-10
---

# Phase 09 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | none — test execution is driven by `package.json` scripts |
| **Quick run command** | `npx vitest run tests/lib/lifecycle-background-observer.test.ts tests/lib/completion-detector.test.ts tests/hooks/create-core-hooks.test.ts tests/tools/delegate-task.test.ts` |
| **Full suite command** | `npm test && npm run typecheck && npm run build` |
| **Estimated runtime** | ~90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/lib/lifecycle-background-observer.test.ts tests/lib/completion-detector.test.ts tests/hooks/create-core-hooks.test.ts tests/tools/delegate-task.test.ts`
- **After every plan wave:** Run `npm test && npm run typecheck && npm run build`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | PH09-01 | T-09-01 | `builtin-subsession` must not complete until stable evidence proves real work happened | unit/integration | `npx vitest run tests/lib/lifecycle-background-observer.test.ts tests/lib/completion-detector.test.ts` | ✅ | ✅ green |
| 09-02-01 | 02 | 1 | PH09-02 | T-09-02 | persisted parent notifications replay exactly once on session start/resume | unit | `npx vitest run tests/hooks/create-core-hooks.test.ts tests/lib/notification-handler.test.ts` | ✅ | ✅ green |
| 09-03-01 | 03 | 2 | PH09-03 | T-09-03 | sync dispatch returns structured encoded payload and never emits truncated raw text | integration | `npx vitest run tests/integration/v3-e2e.test.ts tests/tools/delegate-task-overflow.test.ts` | ✅ | ✅ green |
| 09-04-01 | 04 | 2 | PH09-04 | T-09-04 | `async_dispatch` rename preserves access control and dispatch semantics without ambiguity | unit/integration | `npx vitest run tests/tools/delegate-task.test.ts tests/tools/delegate-task-overflow.test.ts tests/lib/background-manager-harden.test.ts` | ✅ | ✅ green |
| 09-05-01 | 05 | 3 | PH09-05 | T-09-05 | execution routing must not silently claim tmux execution without a real runner or explicit gate | unit/integration | `npx vitest run tests/lib/execution-mode.test.ts tests/lib/background-manager-harden.test.ts tests/integration/v3-e2e.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/lib/lifecycle-background-observer.test.ts` — stability-gate assertions for idle-without-work (line 340) and combined evidence stability (line 380) — implemented in 09-01
- [x] `tests/integration/v3-e2e.test.ts` — sync encoded-envelope assertions via delegate-task-overflow.test.ts (line 243) and lifecycle-process-runner.test.ts — implemented in 09-03
- [x] `tests/lib/execution-mode.test.ts` — tmux execution gating/runner assertions (line 71: tmux-pane submode distinct from builtin-subsession) — implemented in 09-05
- [x] `tests/tools/delegate-task.test.ts` — compatibility coverage for `run_in_background` → `async_dispatch` rename (line 60: negation assertion) — implemented in 09-04

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| tmux pane observability when tmux is installed on a capable host | PH09-05 | local planning host currently lacks tmux, so real pane spawn cannot be exercised here | Install `tmux`, run delegated async task with tmux enabled, confirm pane opens, task runs visibly, and pane/process exit is recorded as completion |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---

## Validation Audit 2026-04-10

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

**Audit result:** No gaps. All Per-Task Map entries verified green. All Wave 0 items addressed by completed plans. VALIDATION.md was in draft state (pre-execution) — statuses updated to reflect actual test results.

| Task | Test run | Result |
|------|----------|--------|
| 09-01-01 | `vitest run lifecycle-background-observer.test.ts completion-detector.test.ts` | 35 passed |
| 09-02-01 | `vitest run create-core-hooks.test.ts notification-handler.test.ts` | 22 passed |
| 09-03-01 | `vitest run v3-e2e.test.ts delegate-task-overflow.test.ts` | 13 passed |
| 09-04-01 | `vitest run delegate-task.test.ts delegate-task-overflow.test.ts background-manager-harden.test.ts` | 38 passed |
| 09-05-01 | `vitest run execution-mode.test.ts background-manager-harden.test.ts v3-e2e.test.ts` | 37 passed |
