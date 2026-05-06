---
phase: 02
slug: v3-runtime-architecture
status: superseded_by_02_verification
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-08
last_reconciled: 2026-04-09
authoritative_status_source: 02-VERIFICATION.md
---

# Phase 02 — Validation Strategy

> Historical validation contract only. The authoritative current state is `.planning/phases/02-v3-runtime-architecture/02-VERIFICATION.md`, which records **17/18 verified truths** with one remaining `runtimePolicyOverride` gap under `RUN-3h`.

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/lib/<target>.test.ts -x` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/lib/<target>.test.ts -x`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | RUN-3c | T-02-01 / T-02-02 | Concurrency supplements platform limits rather than replacing built-ins | unit | `npx vitest run tests/lib/runtime-policy.test.ts tests/lib/concurrency.test.ts -x` | ✅ / ✅ | ⬜ pending |
| 02-01-02 | 01 | 1 | RUN-3h | T-02-03 / T-02-04 | Budget thresholds warn/block deterministically and reset safely on compact | unit | `npx vitest run tests/hooks/create-tool-guard-hooks.test.ts tests/lib/runtime-policy.test.ts -x` | ✅ / ✅ | ⬜ pending |
| 02-02-01 | 02 | 2 | RUN-3a | T-02-05 / T-02-06 | Mode selection chooses safe execution path and degrades cleanly when pane support is unavailable | unit | `npx vitest run tests/lib/background-execution.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | RUN-3a | T-02-07 / T-02-08 | Background launch/status/cleanup preserves lineage and error state | unit | `npx vitest run tests/lib/background-agent.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 3 | RUN-3g | T-02-10 | Advisory routing records rationale and preserves fallback safety | unit | `npx vitest run tests/lib/specialist-routing.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 3 | RUN-3b | T-02-08 / T-02-09 | Exported packets are derived from canonical continuity and can be disabled by policy | unit | `npx vitest run tests/lib/delegation-packet.test.ts tests/lib/delegation-export.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 4 | RUN-3d | T-02-11 / T-02-12 | Recovery uses actual continuity/message seams and reports staleness/risk accurately | unit | `npx vitest run tests/lib/session-recovery.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-04-02 | 04 | 4 | RUN-3d / RUN-3h | T-02-13 | Hook/CQRS wiring restores state and budget reset behavior without duplicate enforcement paths | unit | `npx vitest run tests/hooks/create-session-hooks.test.ts tests/lib/session-recovery.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-05-01 | 05 | 5 | RUN-3e | T-02-14 / T-02-15 | Governance rules persist durably and violations are auditable | unit | `npx vitest run tests/lib/governance-engine.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-05-02 | 05 | 5 | RUN-3e | T-02-16 | Tool-guard hook enforces warn/escalate/block consistently using one entry path | unit | `npx vitest run tests/hooks/create-tool-guard-hooks.test.ts -x` | ✅ | ⬜ pending |
| 02-06-01 | 06 | 6 | RUN-3f | T-02-17 / T-02-18 | Injection happens only when context/governance permit it | unit | `npx vitest run tests/lib/injection-engine.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-06-02 | 06 | 6 | RUN-3f | T-02-19 | Session-start and compaction injection stay aligned and auditable | unit | `npx vitest run tests/hooks/create-core-hooks.test.ts tests/lib/injection-engine.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-07-01 | 07 | 7 | RUN-3h | T-02-20 / T-02-21 | Tool budgets resolve from trusted runtime policy in the live hook path | unit | `CI=true npx vitest run tests/hooks/create-tool-guard-hooks.test.ts -x` | ✅ | ⬜ pending |
| 02-07-02 | 07 | 7 | RUN-3c | T-02-22 | Queue acquire path consumes resolved per-key concurrency policy in live delegation | unit | `CI=true npx vitest run tests/tools/delegate-task.test.ts -x` | ✅ | ⬜ pending |
| 02-08-01 | 08 | 8 | RUN-3a / RUN-3b | T-02-23 | Delegation entrypoint classifies execution mode and persists the chosen route for audit/export | unit | `CI=true npx vitest run tests/lib/execution-mode.test.ts tests/tools/delegate-task.test.ts -x` | ✅ / ✅ | ⬜ pending |
| 02-08-02 | 08 | 8 | RUN-3a | T-02-24 / T-02-25 | Builtin-process execution uses the hardened BackgroundManager path and preserves failure context | unit | `CI=true npx vitest run tests/lib/background-manager-harden.test.ts tests/tools/delegate-task.test.ts -x` | ✅ / ✅ | ⬜ pending |
| 02-09-01 | 09 | 8 | RUN-3f | T-02-26 | Specialist-lane injections match the resolved route for builder, researcher, and critic sessions | unit | `CI=true npx vitest run tests/lib/injection-engine.test.ts -x` | ✅ | ⬜ pending |
| 02-09-02 | 09 | 8 | RUN-3e / RUN-3f | T-02-27 | Session-start and compaction suppress injections from active governance state only | unit | `CI=true npx vitest run tests/hooks/create-core-hooks.test.ts tests/hooks/create-session-hooks.test.ts -x` | ✅ / ✅ | ⬜ pending |
| 02-09-03 | 09 | 8 | RUN-3e | T-02-28 | Overlapping tool calls correlate governance metadata by invocation rather than session-only cache state | unit | `CI=true npx vitest run tests/hooks/create-tool-guard-hooks.test.ts -x` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/lib/background-execution.test.ts` — stubs for RUN-3a mode selection + D-12/D-13 coverage
- [ ] `tests/lib/background-agent.test.ts` — stubs for RUN-3a lifecycle coverage
- [ ] `tests/lib/specialist-routing.test.ts` — stubs for RUN-3g
- [ ] `tests/lib/delegation-packet.test.ts` — stubs for RUN-3b packet shape
- [ ] `tests/lib/delegation-export.test.ts` — stubs for RUN-3b manifest/export policy behavior
- [ ] `tests/lib/session-recovery.test.ts` — stubs for RUN-3d
- [ ] `tests/lib/governance-engine.test.ts` — stubs for RUN-3e
- [ ] `tests/lib/injection-engine.test.ts` — stubs for RUN-3f
- [ ] `tests/hooks/create-session-hooks.test.ts` — session hook restoration coverage if absent
- [ ] `tests/hooks/create-core-hooks.test.ts` — injection/session-start hook coverage if absent

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Risk framing for stale recovery state is understandable to a human operator | RUN-3d | UX wording and operator confidence are not fully captured by unit tests | Simulate stale continuity, trigger recovery flow, confirm the surfaced warning clearly identifies staleness, pending work, and operator choice |
| Hybrid execution selection matches real task intent categories | RUN-3a | Practical task classification quality needs end-to-end spot checks | Run one interactive-style delegation and one research-style delegation; confirm chosen execution modes match the documented classification rules |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** superseded by `02-VERIFICATION.md`
