---
phase: 09
plan: 09-05
status: complete
started: 2026-04-10T19:46:00Z
completed: 2026-04-10T19:55:00Z
key_files:
  created:
    - src/lib/lifecycle-tmux-runner.ts
    - .planning/phases/09-sticky-delegation-corrective/09-05-SUMMARY.md
  modified:
    - src/lib/lifecycle-manager.ts
    - src/lib/types.ts
    - src/tools/delegate-task.ts
    - tests/lib/execution-mode.test.ts
    - tests/lib/background-manager-harden.test.ts
    - tests/integration/v3-e2e.test.ts
    - tests/lib/lifecycle-manager.test.ts
---

## Plan 09-05: Tmux Visible-Worker Runner + Full Delegated-Lifecycle Verification

### What was built
Created `src/lib/lifecycle-tmux-runner.ts` — a dedicated tmux visible-worker runner that executes delegated sessions inside a tmux pane. The runner uses `BackgroundManager.spawn()` to launch `tmux split-window` with `opencode attach -s <sessionID>`, and treats `onComplete(task.id)` (pane/process exit) as the terminal completion signal — a binary signal, not message-count stability polling.

Wired an explicit `execution.submode === "tmux-pane"` branch into `lifecycle-manager.ts` before the builtin-subsession fallback in both async and sync dispatch paths. When `tmuxAvailability` is `"enabled"` but tmux is not detected, throws a hard `[Harness]` error instead of silently falling through.

### Changes made
1. **src/lib/lifecycle-tmux-runner.ts** (new, ~180 LOC):
   - `runLifecycleTmuxTask()` — spawns tmux pane, records lifecycle observations, uses process exit as completion signal
   - `buildTmuxCommand()` — constructs `tmux split-window -P -F #{pane_id} opencode attach -s <sessionID>`
   - Async mode: returns immediately, notifies parent on pane exit
   - Sync mode: waits for pane exit, returns JSON envelope

2. **src/lib/lifecycle-manager.ts**:
   - Added explicit `execution.submode === "tmux-pane"` branch before `builtin-process` in both async and sync paths
   - Hard failure when `tmuxAvailability === "enabled"` but `hasTmux === false`
   - Imports and calls `runLifecycleTmuxTask`

3. **src/lib/types.ts**: Added `defaultDispatchMode`, `tmuxAvailability`, `pollIntervalMs` to `SessionContinuityMetadata` (from 09-04, carried through)

4. **src/tools/delegate-task.ts**: Fixed `pollIntervalMs` schema from `s.enum()` (doesn't support numbers) to `s.number()`; updated type to match

5. **tests/lib/execution-mode.test.ts**: Added test verifying `tmux-pane` submode is distinct from `builtin-subsession`

6. **tests/lib/background-manager-harden.test.ts**: Added two tmux execution tests — routing through tmux runner (not subsession), and explicit error when tmux-pane requested but unavailable

7. **tests/integration/v3-e2e.test.ts**: Updated `run_in_background` → `async_dispatch` references

8. **tests/lib/lifecycle-manager.test.ts**: Updated two tests to decode base64 sync envelope (from 09-03 structured envelope change)

### Verification
- `npm test` — **604 passed, 1 skipped, 1 todo** (all green)
- `npm run typecheck` — **passed**
- `npm run build` — **passed**
- Focused suite: `tests/lib/execution-mode.test.ts`, `tests/lib/background-manager-harden.test.ts`, `tests/integration/v3-e2e.test.ts` — **37/37 passed**

### Self-Check
- [x] All tasks executed
- [x] Each task committed individually
- [x] SUMMARY.md created
- [x] `src/lib/lifecycle-manager.ts` contains explicit `execution.submode === "tmux-pane"` branch
- [x] `src/lib/lifecycle-tmux-runner.ts` exists and calls `BackgroundManager.spawn()` + `onComplete()`
- [x] No `tmux-pane` execution path silently calls `runLifecycleSubsessionTask()`
- [x] Full verification command passes (test + typecheck + build)
- [x] `run_in_background` fully removed from delegate-task schema and description

### Phase 9 Complete — All 5 plans done

| Plan | Status | Summary |
|------|--------|---------|
| 09-01 | ✅ | Harden builtin-subsession completion with message-count stability + 3s poll |
| 09-02 | ✅ | Replay durable pending notifications through createCoreHooks on parent resume |
| 09-03 | ✅ | Preserve sync dispatch with structured base64 output envelope |
| 09-04 | ✅ | Rename run_in_background → async_dispatch, wire dispatch/tmux/poll config |
| 09-05 | ✅ | Implement tmux visible-worker runner, explicit submode branch, full verification |
