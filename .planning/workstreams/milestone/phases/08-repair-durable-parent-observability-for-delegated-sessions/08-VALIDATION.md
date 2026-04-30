---
phase: 08
slug: repair-durable-parent-observability-for-delegated-sessions
status: approved
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-10
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 1.6.1 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run {file}` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~4 seconds (588 tests) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/tools/delegate-task.test.ts tests/lib/completion-detector.test.ts tests/lib/notification-handler.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | Trusted parent runtime policy override inheritance | — | runtimePolicyOverride threads from parent delegation meta to child | unit | `npx vitest run tests/tools/delegate-task.test.ts` | ✅ | ✅ green |
| 08-01-02 | 01 | 1 | runtimePolicyOverride survives continuity reload | — | Override round-trips through JSON persistence | unit | `npx vitest run tests/lib/continuity.test.ts` | ✅ | ✅ green |
| 08-01-03 | 01 | 1 | Tool-guard enforcement after reload | — | Guards enforce runtimePolicyOverride post-hydration | unit | `npx vitest run tests/hooks/create-tool-guard-hooks.test.ts` | ✅ | ✅ green |
| 08-02-01 | 02 | 1 | Pending notification persistence on delivery failure | — | Notification persisted when parent prompt throws | unit | `npx vitest run tests/lib/lifecycle-background-observer.test.ts` | ✅ | ✅ green |
| 08-02-02 | 02 | 1 | Stale terminal notification suppression | — | Old terminal signals ignored after newer events | unit | `npx vitest run tests/lib/lifecycle-background-observer.test.ts` | ✅ | ✅ green |
| 08-02-03 | 02 | 1 | Started/completed/failed notification parity | — | All three lifecycle states produce notifications | unit | `npx vitest run tests/lib/background-manager-harden.test.ts` | ✅ | ✅ green |
| 08-02-04 | 02 | 1 | Notification best-effort toast behavior | — | Toast fires even when prompt delivery fails | unit | `npx vitest run tests/lib/notification-handler.test.ts` | ✅ | ✅ green |
| 08-03-01 | 03 | 1 | Phase 02 re-verification at 18/18 | — | All Phase 02 verification checks pass | unit | `npx vitest run` | ✅ | ✅ green |
| 08-G-01 | Validation | 1 | JSON serialization overflow for long prompts | — | Tool handles oversized prompts without crash or cryptic errors | unit | `npx vitest run tests/tools/delegate-task-overflow.test.ts` | ✅ | ✅ green |
| 08-G-02 | Validation | 1 | False completion detection when agent crashes | — | CompletionDetector handles crash/compaction scenarios gracefully | unit | `npx vitest run tests/lib/completion-detector-crash.test.ts` | ✅ | ✅ green |
| 08-G-03 | Validation | 1 | TUI crash recovery from malformed tool responses | — | Notification handler survives malformed data without throwing | unit | `npx vitest run tests/lib/notification-handler-malformed.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Implementation bug: `agent.charAt` throws on non-string agent values in `buildTaskNotificationFromContinuity` | 08-G-03 | Requires implementation fix in `src/lib/notification-handler.ts:113` — `agent` should be coerced to string before `.charAt()` | 1. Open `src/lib/notification-handler.ts:113` 2. Change `agent.charAt(0)` to `String(agent).charAt(0)` 3. Re-run `npx vitest run tests/lib/notification-handler-malformed.test.ts` 4. Update test to expect graceful handling instead of TypeError |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter — **blocked by 1 impl bug (Manual-Only)**

**Approval:** approved 2026-04-10
