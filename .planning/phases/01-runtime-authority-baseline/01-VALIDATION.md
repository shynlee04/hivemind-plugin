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
| **Quick run command** | `npx tsx --test tests/runtime-entry-attachment.test.ts tests/sdk-supervisor-instance.test.ts tests/start-work-router.test.ts tests/plugin-runtime.test.ts tests/runtime-authority-live-sanity.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsx --test tests/runtime-entry-attachment.test.ts tests/sdk-supervisor-instance.test.ts tests/start-work-router.test.ts tests/plugin-runtime.test.ts`
- **Before Phase 1 closeout:** Run `npx tsx --test tests/runtime-authority-live-sanity.test.ts` as the required `narrow live sanity` lane
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
| 01-02-03 | 02 | 2 | CTRL-02 | narrow live sanity | `npx tsx --test tests/runtime-authority-live-sanity.test.ts` | ⬜ pending | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Existing runtime-entry and supervisor tests already exist in `tests/runtime-entry-attachment.test.ts`
- [x] Existing supervisor status tests already exist in `tests/sdk-supervisor-instance.test.ts`
- [x] Existing routing/runtime-plan tests already exist in `tests/start-work-router.test.ts` and `tests/plugin-runtime.test.ts`
- [x] Existing repo test runner already supports targeted `tsx --test` execution

*Existing infrastructure covers all phase requirements.*

---

## Evidence Lanes

- `local tests` — focused `tsx --test` regressions for attachment, supervisor, routing, and runtime-turn output
- `local diagnostics` — `hm-harness`, `/global/health`, and related readiness artifacts; useful but not completion proof on their own
- `narrow live sanity` — a required Phase 1 live check that boots a real local OpenCode runtime and proves single-runtime `init/attach/reuse` behavior
- `later full live proof` — the broader official-boundary proof suite reserved for Phase 7

Phase 1 completion requires `local tests` plus the `narrow live sanity` lane. `local diagnostics` remain supporting evidence, and `later full live proof` stays deferred to Phase 7.

---

## Validation Sign-Off

- [x] All tasks have automated verification or existing test coverage targets
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all referenced verification surfaces
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
