---
phase: 14-delegate-task-truth-reset-archive-phases-09-13-remove-trash-
type: runtime-uat-schedule
status: pending
created: 2026-04-21
requires: live-opencode-runtime
---

# Phase 14 Runtime UAT Schedule

**Prerequisite:** Live OpenCode runtime with harness plugin loaded.

## Pending Runtime Tests

These items require a running OpenCode instance and cannot be verified by code audit alone.

### RT-01: Live Always-Background Dispatch
- **Source:** Phase 14 UAT item #13
- **Steps:**
  1. Start OpenCode with harness plugin
  2. Invoke delegate-task tool with an agent + prompt
  3. Verify delegation record created with status "active"
  4. Verify child session spawned and visible
  5. Verify parent session continues (not blocked)
- **Expected:** Delegation dispatches asynchronously; parent session remains responsive

### RT-02: Live Recovery After Reload
- **Source:** Phase 14 UAT item #14
- **Steps:**
  1. Create a delegation (from RT-01 or standalone)
  2. Reload/restart the OpenCode session
  3. Call recoverPending() (or trigger via plugin lifecycle)
  4. Verify delegation records restored from persistence
  5. Verify active delegations resume monitoring
- **Expected:** Delegations survive session restart; monitoring resumes

### RT-03: Live Safety Ceiling Abort
- **Source:** Phase 14 UAT item #15
- **Steps:**
  1. Create a delegation with safetyCeilingMs set to a short value (e.g., 5000ms)
  2. Let the delegation run without stabilizing
  3. Wait for safety ceiling to trigger
  4. Verify delegation status transitions to "timeout"
  5. Verify cleanup completes (timers cleared, semaphore released)
- **Expected:** Safety ceiling terminates runaway delegations cleanly

### RT-04: PTY Command Execution (Phase 16 integration)
- **Source:** Phase 16 G-02 dual-path verification
- **Steps:**
  1. Invoke run-background-command tool with a shell command
  2. Verify PTY session spawned
  3. Verify output captured and returned
  4. Verify session cleanup after completion
- **Expected:** PTY commands execute and complete through the shared PtyManager

## Scheduling

- **Priority:** Medium (no regressions found in code audit; runtime verification confirms production readiness)
- **Recommended timing:** Before Phase 17 or next milestone boundary
- **Estimated duration:** 30-45 minutes for all 4 tests
