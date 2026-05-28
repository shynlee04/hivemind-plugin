---
phase: C4
slug: C4-Performance-Optimization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-28
---

# Phase C4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.7 |
| **Config file** | `vitest.config.ts` at project root |
| **Quick run command** | `npx vitest run --reporter=verbose -t "<test name>"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run -t "<specific test>"` — targeted test for the concern being fixed
- **After every plan wave:** Run `npm test` — full suite
- **Before `/gsd-verify-work`:** Full suite green (no regressions) + `npm run typecheck` (no type errors)
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| C4-01-01 | 01 | 1 | REQ-01 (4.1) | — | N/A — cache addition, no new input surface | unit | `npx vitest run tests/tools/delegation/delegation-status-v2.test.ts` | ✅ | ⬜ pending |
| C4-01-02 | 01 | 1 | REQ-02 (4.2) | — | N/A — sync→async FS, no new input surface | unit | `npx vitest run tests/tools/bootstrap-init.test.ts` | ✅ | ⬜ pending |
| C4-02-01 | 02 | 2 | REQ-03 (4.3) | — | N/A — timer cleanup, no new input surface | unit | `npx vitest run -t "pruneStaleTimers"` | ❌ W0 | ⬜ pending |
| C4-02-02 | 02 | 2 | REQ-04 (4.4) | T-C4-01 | Hardcoded git commands — no user input interpolated. `sessionTitle` sanitized via regex at line 107. | unit | `npx vitest run tests/features/governance-engine/create-governance-session.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/coordination/completion/detector-stability-prune.test.ts` — covers `pruneStaleTimers` (REQ-03)

*Existing infrastructure covers all other phase requirements.*

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
