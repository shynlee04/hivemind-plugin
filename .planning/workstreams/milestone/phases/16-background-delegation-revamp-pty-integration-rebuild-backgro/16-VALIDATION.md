---
phase: 16
slug: background-delegation-revamp-pty-integration-rebuild-backgro
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-21
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/lib/pty/**/*.test.ts tests/lib/spawner/**/*.test.ts tests/lib/delegation-manager.test.ts tests/lib/session-api.test.ts tests/tools/delegate-task.test.ts tests/tools/delegation-status.test.ts tests/tools/run-background-command.test.ts tests/plugins/plugin-lifecycle.test.ts` |
| **Full suite command** | `npm test && npm run typecheck && npm run build` |
| **Estimated runtime** | ~90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/lib/pty/**/*.test.ts tests/lib/spawner/**/*.test.ts tests/lib/delegation-manager.test.ts tests/lib/session-api.test.ts tests/tools/delegate-task.test.ts tests/tools/delegation-status.test.ts tests/tools/run-background-command.test.ts tests/plugins/plugin-lifecycle.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | D-05, D-06 | T-16-01 / T-16-02 | PTY/spawner contracts are typed, explicit, and constrained to write-capable delegation use | unit | `npx vitest run tests/lib/helpers.test.ts -t extractAssistantText` | ✅ existing helper test file | ⬜ pending |
| 16-02-01 | 02 | 2 | D-04, D-05 | T-16-03 / T-16-04 | PTY manager starts interactive runtimes, records exit state, and cleans up orphaned sessions | unit/integration | `npx vitest run tests/lib/pty/pty-manager.test.ts tests/lib/pty/pty-buffer.test.ts` | ✅ existing | ⬜ pending |
| 16-03-01 | 03 | 2 | D-01, D-02, D-06 | T-16-05 / T-16-06 | Spawner creates parent-linked write-capable child sessions and falls back from PTY to headless with explicit reason | integration | `npx vitest run tests/lib/spawner/session-creator.test.ts tests/lib/spawner/concurrency-key.test.ts tests/lib/spawner/parent-directory.test.ts tests/lib/spawner/pty-setup.test.ts` | ✅ existing | ⬜ pending |
| 16-04-01 | 04 | 3 | D-03, D-09, D-12, D-13, D-14, D-15, D-16, D-17 | T-16-07 / T-16-08 | Delegation runtime preserves WaiterModel, dual-signal completion, single lifecycle ownership, and truthful status polling | integration | `npx vitest run tests/lib/delegation-manager.test.ts tests/tools/delegate-task.test.ts tests/tools/delegation-status.test.ts tests/plugins/plugin-lifecycle.test.ts` | ✅ existing | ⬜ pending |
| 16-05-01 | 05 | 5 | D-12, D-13, D-14, D-15, D-16, D-17 | T-16-05-01 / T-16-05-02 | Canonical queue-key context persists through dispatch/status surfaces and dual-signal stability uses real message-count comparisons with non-terminal watchdog semantics | integration | `npx vitest run tests/lib/delegation-manager.test.ts tests/lib/session-api.test.ts tests/tools/delegate-task.test.ts tests/tools/delegation-status.test.ts` | ✅ existing | ⬜ pending |
| 16-06-01 | 06 | 6 | D-04A, D-05, D-07, D-11, D-12, D-13, D-16, D-17 | T-16-06-01 / T-16-06-03 | Agent delegations stay SDK-backed, command/process surfaces are PTY-backed when available, and headless fallback remains truthful without fixed-timeout completion | integration | `npx vitest run tests/lib/delegation-manager.test.ts tests/lib/pty/pty-manager.test.ts tests/tools/delegate-task.test.ts tests/tools/delegation-status.test.ts` | ✅ existing | ⬜ pending |
| 16-06-02 | 06 | 6 | D-04A, D-05, D-16 | T-16-06-01 / T-16-06-03 | Standalone run-background-command reuses the shared PtyManager + queue/semaphore governance and proves shared-session ownership through runtime-truthful integration coverage | integration | `npx vitest run tests/tools/run-background-command.test.ts tests/lib/pty/pty-manager.test.ts tests/plugins/plugin-lifecycle.test.ts` | ⚠ planned new tool test file | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/lib/pty/pty-manager.test.ts` — PTY spawn / exit / cleanup coverage for D-04 and D-05
- [x] `tests/lib/pty/pty-buffer.test.ts` — output buffering and offset reads for PTY runtime observability
- [x] `tests/lib/spawner/session-creator.test.ts` — parent-linked child session lineage + write-capable permission profile for D-01 and D-02
- [x] `tests/lib/spawner/concurrency-key.test.ts` — provider/model/agent concurrency key derivation for D-06
- [x] `tests/lib/spawner/parent-directory.test.ts` — deterministic working-directory resolution for child sessions
- [x] `tests/lib/spawner/pty-setup.test.ts` — PTY-first runtime selection with explicit headless fallback reason
- [x] `tests/plugins/plugin-lifecycle.test.ts` — verify only one lifecycle owner is wired after D-09 cleanup

Wave 0 is complete for pre-existing PTY/spawner/plugin-lifecycle scaffold files referenced by this validation contract. Phase 16 remains pre-execution for plans 05/06: file presence is no longer a blocker, but plan-specific behavior and any new artifacts introduced by those plans still require implementation and verification.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Agent delegation stays truthful about SDK execution | D-04A, D-16 | Requires a live OpenCode host and actual child-session orchestration rather than a mocked transport-only proof | Dispatch an agent delegation, confirm foreground work continues immediately, and verify `delegation-status` reports `executionMode: sdk` with no fake PTY session metadata |
| Command/process delegation and standalone PTY tool share one real PTY session universe | D-04A, D-05, D-16 | Requires a live PTY-capable runtime host and actual terminal I/O | Run a command/process delegation or `run-background-command` session, confirm `executionMode: pty`, verify output continues incrementally, and confirm list/output/terminate operations see the same session from the shared manager |
| Headless fallback remains truthful when PTY setup is unavailable | D-04A, D-16 | Requires forcing PTY unavailability in a real runtime host rather than a stubbed test transport | Disable PTY support or inject PTY spawn failure for a command/process surface, then confirm `delegation-status` or tool output returns `executionMode: headless` with a non-empty `fallbackReason` and no fake PTY session ID |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
