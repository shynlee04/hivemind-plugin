# Phase 22: Coordination Status + Error Unification — Validation

**Generated:** 2026-05-22
**Based on:** 22-SPEC.md (9 requirements), 22-01-PLAN.md, 22-02-PLAN.md, 22-03-PLAN.md

---

## 1. Automated Verify Commands

### Per Plan

| Plan | Command | Frequency |
|------|---------|-----------|
| 22-01 | `npx vitest run tests/lib/coordination/delegation/status-mapping.test.ts && npm run typecheck` | Per task commit |
| 22-02 | `npx vitest run tests/lib/coordination/delegation/notification-router.test.ts && npm run typecheck` | Per task commit |
| 22-03 | `npx vitest run tests/lib/coordination/ && npm run typecheck && git diff --name-only HEAD` | Per task commit + gate |

### Phase Gate

```bash
npx vitest run tests/lib/coordination/ && npm run typecheck && git diff --name-only HEAD
```

---

## 2. Feedback Latency

| Plan | Test Type | Est. Runtime | Max Iterations | Total |
|------|-----------|-------------|----------------|-------|
| 22-01 | unit (status-mapping) | < 3s | 3 (RED/GREEN/REFACTOR) | < 9s |
| 22-02 | unit (notification-router) | < 5s | 3 (RED/GREEN/REFACTOR) | < 15s |
| 22-03 | unit + integration + typecheck | < 10s | 3 (impl/read/gate) | < 30s |

All plans under 30s total feedback loop — no slow tests identified.

---

## 3. Sampling Continuity

| Check | Status | Note |
|-------|--------|------|
| Tests pass before merge? | ❓ | Gate check required after Wave 3 completion |
| Typecheck passes before merge? | ❓ | `npm run typecheck` runs per-commit |
| Scope boundary verified? | ❓ | `git diff --name-only HEAD` in Wave 3 gate |
| No flaky tests? | ✅ | All tests are pure unit — no async, no network, no timers |

---

## 4. Wave 0 Completeness

### Pre-existing Test Files

| File | Exists? | Coverage |
|------|---------|----------|
| `tests/lib/coordination/delegation/notification-router.test.ts` | ✅ Existing | Extended in Wave 2 (P22-05/06/07a/08) |
| `tests/lib/coordination/delegation/status-mapping.test.ts` | ❌ New | Wave 0: P22-01/02/04, Wave 3: P22-07b |
| `tests/lib/coordination/continuity/continuity.test.ts` | ❌ Does not exist | P22-07b tests placed in status-mapping.test.ts instead |

### Wave 0 Gaps

| Gap | Impact | Resolution |
|-----|--------|------------|
| No continuity.test.ts | No integration coverage for PendingNotification persistence round-trip | Deferred — continuity integration test added when continuity.test.ts is created in later phase |

---

## 5. Test-to-Requirement Mapping

| REQ | Wave | Test File | Test Name Pattern | Verification |
|-----|------|-----------|-------------------|--------------|
| P22-01 | 1 | status-mapping.test.ts | `delegationStatusToHarnessStatus` | Unit: maps all 5 values correctly |
| P22-02 | 1 | status-mapping.test.ts | `DelegationErrorCode` | Unit: const union has 12 codes |
| P22-03 | 1 | status-mapping.test.ts | `DelegationError` | Unit: interface fields |
| P22-04 | 1 | status-mapping.test.ts | `createDelegationError` | Unit: factory produces valid error |
| P22-05 | 2 | notification-router.test.ts | `retry` | Unit: counter increments, drops at max |
| P22-06 | 2 | notification-router.test.ts | `TTL` | Unit: expired dropped |
| P22-07a | 2 | notification-router.test.ts | `PendingNotificationRecord` | Unit: struct has new fields |
| P22-07b | 3 | status-mapping.test.ts | `PendingNotification` | Unit: type has retry fields |
| P22-08 | 2 | notification-router.test.ts | `replayPending` | Unit: filters expired + purges Map |
| P22-09 | 3 | git diff | `--name-only` | Gate: scope boundary |

---

## 6. Wave Execution Order

```
Wave 1 (22-01) ──► Wave 2 (22-02) ──► Wave 3 (22-03)
  3 tasks             3 tasks             4 tasks
  ~9s loop           ~15s loop           ~30s loop
```

Sequential: each wave depends on previous. No parallelization possible.
