---
phase: 14
slug: wire-monitor-notification-into-delegationmanager-dispatch-cl
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-19
---

# Phase 14 - Validation Strategy

Per-phase validation contract for wiring monitor/notification behavior into the delegation dispatch path.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/tools/delegation/delegate-task.test.ts tests/lib/delegation-manager.test.ts` |
| **Full suite command** | `npm run typecheck && npm test` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck` and the narrow Vitest command for files touched by the task.
- **After every plan wave:** Run `npm run typecheck && npm test` unless the plan declares a narrower pre-existing failure allowance.
- **Before `/gsd-verify-work`:** Full suite must be run and any failures must be classified as new or pre-existing.
- **Max feedback latency:** 120 seconds for narrow checks; full-suite latency may exceed this but must run before completion claims.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | Phase-14 | T-14-01 | Dispatch wiring preserves queue/session boundaries | unit | `npx vitest run tests/lib/delegation-manager.test.ts` | W0 | pending |
| 14-01-02 | 01 | 1 | Phase-14 | T-14-02 | Monitor/router failures do not corrupt persisted delegation records | unit | `npx vitest run tests/tools/delegation/delegate-task.test.ts` | W0 | pending |
| 14-02-01 | 02 | 2 | Phase-14 | T-14-03 | Notification path is observable without requiring interactive shell state | integration/manual | `npm run typecheck && npm test` plus live delegate-task UAT | W0 | pending |

---

## Wave 0 Requirements

- [ ] Add or update failing RED tests that prove monitor/router options reach the actual `delegate-task` to `DelegationManager.dispatch` path.
- [ ] Add or update failure-mode tests for monitor/router callback errors and persistence safety.
- [ ] Confirm existing test names and paths before editing; do not assume stale test locations.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| TUI notification visible to the user | Phase-14 | Toast/prompt display depends on live OpenCode runtime | Run a real `delegate-task` from OpenCode, observe TUI notification, and capture exact command/output in the phase summary. |
| Progressive monitor injection in a live delegated session | Phase-14 | Requires live child-session behavior | Dispatch a long-running subagent, confirm monitor thresholds inject or notify without corrupting session state. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify commands or explicit Wave 0 dependencies.
- [ ] No 3 consecutive tasks lack automated verification.
- [ ] Wave 0 covers all missing test references.
- [ ] No watch-mode flags in verification commands.
- [ ] New failures are separated from pre-existing failures.
- [ ] `nyquist_compliant: true` remains set in frontmatter after task mapping is finalized.

**Approval:** pending
