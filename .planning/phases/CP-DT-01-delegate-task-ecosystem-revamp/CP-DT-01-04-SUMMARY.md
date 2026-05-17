---
phase: CP-DT-01
plan: 04
subsystem: coordination-delegation-loops
tags: [delegate-task-v2, manager-decomposition, auto-loop, ralph-loop, chaining, tdd, vitest]

requires:
  - phase: CP-DT-01-01
    provides: dispatcher, lifecycle, monitor, notification, retry, and slot foundations
  - phase: CP-DT-01-02
    provides: DelegationCoordinator and CompletionDetector dual-signal wiring
  - phase: CP-DT-01-03
    provides: delegate-task/delegation-status v2 tool boundary
provides:
  - DelegationManager thin facade under 200 LOC with runtime adapter preserving legacy plugin wiring
  - AutoLoopEngine for sequential same-agent delegation iterations with previous-result prompt context
  - RalphLoopEngine for round-robin agent delegation cycles with previous-result prompt context
  - DelegationCoordinator.chain() for sequential chain steps with failure stop behavior
affects: [REQ-AL-01, REQ-AL-02, REQ-RC-02, NFR-05, NFR-06]

tech-stack:
  added: []
  patterns: [tdd-red-green, facade-runtime-adapter, sequential-loop, round-robin-loop, result-context-chaining]

key-files:
  created:
    - src/coordination/delegation/manager-runtime.ts
    - src/features/auto-loop/.gitkeep
    - src/features/auto-loop/index.ts
    - src/features/auto-loop/types.ts
    - src/features/ralph-loop/.gitkeep
    - src/features/ralph-loop/index.ts
    - src/features/ralph-loop/types.ts
    - tests/lib/coordination/delegation/manager-decomposition.test.ts
    - tests/lib/features/auto-loop.test.ts
    - tests/lib/features/ralph-loop.test.ts
  modified:
    - src/coordination/delegation/manager.ts
    - src/coordination/delegation/coordinator.ts
    - src/coordination/delegation/dispatcher.ts

key-decisions:
  - "DelegationManager giữ import/public class ổn định, còn implementation cũ được chuyển sang manager-runtime.ts để manager.ts là facade 158 LOC."
  - "Auto-loop và ralph-loop dùng coordinator.dispatch seam để không tự gọi OpenCode SDK hoặc mutate durable state."
  - "Chaining hiện là helper tuần tự trong DelegationCoordinator; unit test dùng dispatch seam để xác minh context passing/failure stop."

metrics:
  duration: "~1h"
  completed: "2026-05-18T05:31:00Z"
  tasks: "1/1"
  files_changed: 13
  tests_added: 13
---

# Phase CP-DT-01 Plan 04: Manager Decomposition + Loop Engines Summary

**DelegationManager đã được tách thành facade mỏng 158 LOC, kèm auto-loop, ralph-loop, và chaining qua coordinator để hỗ trợ delegation tuần tự/cycling có truyền kết quả trước đó.**

## Kết quả chính

- Tạo `manager-runtime.ts` chứa runtime adapter legacy để bảo toàn plugin wiring hiện tại.
- Viết lại `manager.ts` thành facade mỏng, hỗ trợ injected `coordinator`/`lifecycle` cho v2 và fallback sang runtime adapter khi plugin khởi tạo bằng `OpenCodeClient`.
- Thêm `AutoLoopEngine` với `maxIterations`, sequential dispatch, previous-result prompt injection, và dừng sớm khi gặp `error`/`timeout` hoặc `stopCondition`.
- Thêm `RalphLoopEngine` với round-robin agent rotation, per-agent results, previous-result prompt injection, và dừng khi thất bại terminal.
- Thêm `DelegationCoordinator.chain()` cho chuỗi delegation tuần tự, `usePreviousResult`, và stop-on-failure.
- Đăng ký thư mục mới bằng `.gitkeep` trong `src/features/auto-loop/` và `src/features/ralph-loop/`.

## TDD Evidence

### RED

- `npx vitest run tests/lib/coordination/delegation/manager-decomposition.test.ts tests/lib/features/auto-loop.test.ts tests/lib/features/ralph-loop.test.ts --reporter=verbose` → FAIL trước implementation:
  - `manager.dispatchDelegation is not a function`
  - `manager.listDelegations is not a function`
  - auto-loop/ralph-loop modules chưa tồn tại (`ERR_MODULE_NOT_FOUND`)

### GREEN / Final

- `npx vitest run tests/lib/coordination/delegation/manager-decomposition.test.ts tests/lib/features/auto-loop.test.ts tests/lib/features/ralph-loop.test.ts --reporter=verbose` → 3 files passed, 13 tests passed.
- `npx vitest run tests/lib/coordination/delegation/ --reporter=verbose` → 7 files passed, 32 tests passed.
- `npx vitest run tests/lib/features/session-tracker/ --reporter=verbose` → FAIL vì path trong plan không tồn tại.
- Corrected regression path: `npx vitest run tests/features/session-tracker/ --reporter=verbose` → 44 files passed, 426 tests passed.
- `npm run typecheck` → `tsc --noEmit` clean.
- LOC gate:
  - `src/coordination/delegation/manager.ts` = 158 LOC
  - `src/features/auto-loop/index.ts` = 43 LOC
  - `src/features/auto-loop/types.ts` = 24 LOC
  - `src/features/ralph-loop/index.ts` = 39 LOC
  - `src/features/ralph-loop/types.ts` = 24 LOC
  - `src/coordination/delegation/coordinator.ts` = 123 LOC

## Task Commits

1. `c499f8b5` — `test(CP-DT-01-04): add failing loop and manager decomposition contracts`
2. `dd011134` — `feat(CP-DT-01-04): decompose manager and add delegation loops`

## Files Created/Modified

- `src/coordination/delegation/manager.ts` — facade giữ class/import ổn định, route sang coordinator/lifecycle hoặc runtime adapter.
- `src/coordination/delegation/manager-runtime.ts` — runtime adapter legacy, bảo toàn SDK/command delegation behavior hiện tại.
- `src/coordination/delegation/coordinator.ts` — thêm `ChainStep` và `chain()`.
- `src/coordination/delegation/dispatcher.ts` — mở rộng `PreflightParams` để nhận prompt/safety ceiling cho loop/chain contracts.
- `src/features/auto-loop/index.ts` và `types.ts` — auto-loop engine/contracts.
- `src/features/ralph-loop/index.ts` và `types.ts` — ralph-loop engine/contracts.
- `tests/lib/coordination/delegation/manager-decomposition.test.ts` — 4 manager facade tests.
- `tests/lib/features/auto-loop.test.ts` — 4 auto-loop tests.
- `tests/lib/features/ralph-loop.test.ts` — 5 ralph-loop/chaining tests.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected invalid session-tracker regression path**
- **Found during:** Verification
- **Issue:** Plan listed `tests/lib/features/session-tracker/`, but actual tests live at `tests/features/session-tracker/`.
- **Fix:** Ran the plan command to prove the path issue, then ran the actual session-tracker suite path.
- **Files modified:** None
- **Commit:** N/A

**2. [Rule 2 - Compatibility] Preserved legacy plugin runtime wiring during facade decomposition**
- **Found during:** Manager decomposition
- **Issue:** Replacing manager entirely with injected v2 modules would break existing plugin construction path `new DelegationManager(client, { ptyManager, runtimePolicy })` before all legacy SDK/command paths are migrated.
- **Fix:** Moved legacy implementation to `manager-runtime.ts` and made `manager.ts` a facade that delegates to injected v2 modules when present, otherwise falls back to runtime adapter.
- **Files modified:** `src/coordination/delegation/manager.ts`, `src/coordination/delegation/manager-runtime.ts`
- **Commit:** `dd011134`

## Known Stubs

None. Stub scan only found local accumulator defaults (`[]`, `{}`) in loop/coordinator code and constructor default options; these do not flow to UI rendering and are not placeholder data sources.

## Threat Flags

None. No new network endpoint, auth path, file access trust boundary, or schema persistence boundary was introduced. New loop engines dispatch through the existing coordinator trust boundary.

## Self-Check: PASSED

- `FOUND: summary` — `.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-04-SUMMARY.md` exists.
- `FOUND: c499f8b5` — RED test commit exists in git history.
- `FOUND: dd011134` — GREEN implementation commit exists in git history.
