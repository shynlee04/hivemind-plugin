---
phase: 16
slug: background-delegation-revamp-pty-integration-rebuild-backgro
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| **Quick run command** | `npx vitest run tests/lib/pty/**/*.test.ts tests/lib/spawner/**/*.test.ts tests/plugins/plugin-lifecycle.test.ts -x` |
| **Full suite command** | `npm test && npm run typecheck && npm run build` |
| **Estimated runtime** | ~90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/lib/pty/**/*.test.ts tests/lib/spawner/**/*.test.ts tests/plugins/plugin-lifecycle.test.ts -x`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | D-05, D-06 | T-16-01 / T-16-02 | PTY/spawner contracts are typed, explicit, and constrained to write-capable delegation use | unit | `npx vitest run tests/lib/helpers.test.ts -t extractAssistantText -x` | ✅ existing helper test file | ⬜ pending |
| 16-02-01 | 02 | 2 | D-04, D-05 | T-16-03 / T-16-04 | PTY manager starts interactive runtimes, records exit state, and cleans up orphaned sessions | unit/integration | `npx vitest run tests/lib/pty/pty-manager.test.ts tests/lib/pty/pty-buffer.test.ts -x` | ❌ Wave 0 | ⬜ pending |
| 16-03-01 | 03 | 2 | D-01, D-02, D-06 | T-16-05 / T-16-06 | Spawner creates parent-linked write-capable child sessions and falls back from PTY to headless with explicit reason | integration | `npx vitest run tests/lib/spawner/session-creator.test.ts tests/lib/spawner/concurrency-key.test.ts tests/lib/spawner/parent-directory.test.ts tests/lib/spawner/pty-setup.test.ts -x` | ❌ Wave 0 | ⬜ pending |
| 16-04-01 | 04 | 3 | D-03, D-09, D-12, D-13, D-14, D-15, D-16, D-17 | T-16-07 / T-16-08 | Delegation runtime preserves WaiterModel, dual-signal completion, single lifecycle ownership, and truthful status polling | integration | `npx vitest run tests/lib/delegation-manager.test.ts tests/tools/delegate-task.test.ts tests/tools/delegation-status.test.ts tests/plugins/plugin-lifecycle.test.ts -x` | ✅ mostly existing / ❌ plugin lifecycle Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/lib/pty/pty-manager.test.ts` — PTY spawn / exit / cleanup coverage for D-04 and D-05
- [ ] `tests/lib/pty/pty-buffer.test.ts` — output buffering and offset reads for PTY runtime observability
- [ ] `tests/lib/spawner/session-creator.test.ts` — parent-linked child session lineage + write-capable permission profile for D-01 and D-02
- [ ] `tests/lib/spawner/concurrency-key.test.ts` — provider/model/agent concurrency key derivation for D-06
- [ ] `tests/lib/spawner/parent-directory.test.ts` — deterministic working-directory resolution for child sessions
- [ ] `tests/lib/spawner/pty-setup.test.ts` — PTY-first runtime selection with explicit headless fallback reason
- [ ] `tests/plugins/plugin-lifecycle.test.ts` — verify only one lifecycle owner is wired after D-09 cleanup

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Background delegation behaves interactively in a real PTY-backed child session | D-04, D-05 | Requires a live OpenCode host and an actual child session with terminal I/O | Run a delegated task that prompts for incremental shell output, confirm `delegation-status` shows `executionMode: pty`, and verify output continues after foreground work resumes |
| Headless fallback remains truthful when PTY setup is unavailable | D-04 | Requires forcing PTY unavailability in a real runtime host rather than a stubbed test transport | Disable PTY support or inject PTY spawn failure, dispatch a task, and confirm `delegation-status` returns `executionMode: headless` with a non-empty `fallbackReason` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
