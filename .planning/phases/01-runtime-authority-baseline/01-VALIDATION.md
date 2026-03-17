---
phase: 1
slug: runtime-authority-baseline
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-18
---

# Phase 1 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `tsx --test` + repository `npm test` gate |
| **Config file** | `package.json` |
| **Quick run command** | `npx tsx --test tests/runtime-entry-attachment.test.ts tests/sdk-supervisor-instance.test.ts tests/start-work-router.test.ts tests/plugin-runtime.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsx --test tests/runtime-entry-attachment.test.ts tests/sdk-supervisor-instance.test.ts tests/start-work-router.test.ts tests/plugin-runtime.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | CTRL-01 | unit/integration | `npx tsx --test tests/sdk-supervisor-instance.test.ts tests/runtime-entry-attachment.test.ts` | ✅ | ⬜ pending |
| 01-01-02 | 01 | 1 | CTRL-01 | unit/integration | `npx tsx --test tests/sdk-supervisor-instance.test.ts tests/plugin-assembly-smoke.test.ts` | ✅ | ⬜ pending |
| 01-02-01 | 02 | 2 | CTRL-02 | unit | `npx tsx --test tests/start-work-router.test.ts tests/plugin-runtime.test.ts` | ✅ | ⬜ pending |
| 01-02-02 | 02 | 2 | CTRL-02 | integration | `npx tsx --test tests/runtime-turn-output.test.ts tests/start-work-router.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Existing runtime-entry and supervisor tests already exist in `tests/runtime-entry-attachment.test.ts`
- [x] Existing supervisor status tests already exist in `tests/sdk-supervisor-instance.test.ts`
- [x] Existing routing/runtime-plan tests already exist in `tests/start-work-router.test.ts` and `tests/plugin-runtime.test.ts`
- [x] Existing repo test runner already supports targeted `tsx --test` execution

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

All Phase 1 behaviors have automated verification at planning time. Live official-boundary proof is intentionally deferred to Phase 7 and should not be treated as a substitute for this phase's fast regression loop.

---

## Validation Sign-Off

- [x] All tasks have automated verification or existing test coverage targets
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all referenced verification surfaces
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
