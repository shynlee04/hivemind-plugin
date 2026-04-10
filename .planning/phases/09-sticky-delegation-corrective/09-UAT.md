---
status: failed
phase: 09-sticky-delegation-corrective
source:
  - forensic investigation 2026-04-10
  - live runtime evidence from session ses_2884ea5eaffeE1NjPgtLxf333J
started: 2026-04-10
updated: 2026-04-10
---

## Status: FAILED — Phase 09 code exists but is functionally broken

This UAT replaces the quarantined `09-UAT-quarantined-2026-04-10.md` which was fabricated by an autonomous agent without human verification.

## Runtime Evidence

On 2026-04-10, 5 `delegate-task` calls were made with `async_dispatch: true` in a live session. Results:

| Child Session | Reported | Actual | Duration |
|---|---|---|---|
| `ses_28849b832ffeLyhHLVz5DUHx0z` | "started" → success | FAILED: timed out after 30m 2s | 21ms false start |
| `ses_28849b82bffe8gQmkHW14u8Pvc` | "started" → success | FAILED: timed out after 30m 2s | 20ms false start |
| `ses_28849b81dffe0qWMZS05tKlWGg` | "started" → success | FAILED: timed out after 30m 2s | 21ms false start |
| `ses_28849b812ffex4XpQhszNcazpT` | "started" → completed | Never ran (queued, never dequeued) | 17ms false completion |
| `ses_28849b804ffe9K3015qYI9lJZu` | "started" → completed | Never ran (queued, never dequeued) | 12ms false completion |

## Test Results

### 1. Build + Typecheck Pass
expected: `npm run build` and `npm run typecheck` both succeed with no errors
result: pass
evidence: Exit code 0 on both commands (verified by code-existence audit)
note: This is a necessary but insufficient condition. Code compiling does not mean it works.

### 2. Full Test Suite Pass
expected: `npm test` returns 604+ passing tests, 0 failures
result: pass (604 passed, 1 skipped)
evidence: Tests pass
note: **Tests are predominantly mock-heavy and do not validate runtime behavior.** See test reality assessment below.

### 3. Stable Evidence Completion (09-01)
expected: CompletionDetector integrates into observer, tracks combined message+tool evidence, has stability gate
result: CODE EXISTS BUT DOES NOT WORK AT RUNTIME
evidence: Code at `lifecycle-background-observer.ts:54-58, 120, 186-199` matches claims
failure_reason: 
  - Bug 3: Initial prompt message counted as evidence (should only count assistant messages)
  - Bug 4: Cached `session.idle` events bypass stability timer entirely
  - Bug 2: `checkSessionExists()` defaults to "busy", enabling premature busy→idle detection
  - See live evidence: 3 sessions timed out at 30m, observer never correctly detected completion

### 4. 3000ms Polling Cadence (09-01)
expected: Observer polls at 3000ms intervals
result: CODE EXISTS — constant defined at `lifecycle-background-observer.ts:32`
note: User specification requires 15s initial + 5s incremental backoff, not fixed 3s. This is a design gap, not a bug per se, but the fixed interval is too aggressive for production use.

### 5. Zero-Evidence Idle Rejection (09-01)
expected: Idle sessions with zero messages/tool-calls are not marked complete
result: PARTIAL — gate exists but is bypassed
failure_reason: `getCombinedEvidenceCount()` counts the initial user prompt as evidence, so `combinedEvidenceCount` is >= 1 even when no assistant output exists. The gate at `> 0` passes with just the prompt message.

### 6. Notification Replay on Parent Create (09-02)
expected: Pending notifications replay as toasts when parent session is created
result: CODE EXISTS — `create-core-hooks.ts:106-108`
evidence: Logic verified in code. Tests use real file persistence (REAL-ish classification).
note: Cannot be verified at runtime because delegation itself is broken. This feature has never been tested in a real end-to-end flow.

### 7. Notification Replay on Parent Resume (09-02)
expected: Pending notifications replay on session resume with recovery state
result: CODE EXISTS — `create-core-hooks.ts:108`
note: Same caveat as test 6. Untested in real flows.

### 8. Exactly-Once Notification Clearing (09-02)
expected: Notifications cleared only after successful toast injection
result: CODE EXISTS — `create-core-hooks.ts:119-129`
note: Try/catch ordering is correct. Untested in real flows.

### 9. Sync Envelope Decoding (09-03)
expected: Sync delegation returns base64-encoded JSON envelope
result: CODE EXISTS — `lifecycle-process-runner.ts:297-321`
evidence: Function exists, encoding logic is correct
note: Only tested with mocked `client.session.prompt`. Never tested against a real prompt cycle.

### 10. Large Sync Response Parsing (09-03)
expected: 180KB text roundtrips through base64 envelope
result: CODE EXISTS — test at `delegate-task-overflow.test.ts:243-281`
note: Test uses real `createHarnessLifecycleManager` but mocked SDK transport. The base64 encoding is a pure transformation that likely works, but the full prompt→response→encode→decode pipeline is untested.

### 11. async_dispatch Parameter Present (09-04)
expected: Tool uses `async_dispatch` instead of `run_in_background`
result: CODE EXISTS — verified at `delegate-task.ts:196, 234-236, 218, 134, 136, 143`
note: This is a rename. The parameter exists. However, the async dispatch path itself is broken (see bugs 1-5).

### 12. Dispatch Config Persistence (09-04)
expected: `defaultDispatchMode`, `tmuxAvailability`, `pollIntervalMs` persist across restarts
result: ACTUALLY WORKS — the quarantined UAT falsely claimed this was broken
evidence: `continuity-normalizers.ts:635-641` correctly normalizes all 3 fields. The fabricated UAT marked this as "major severity issue" but the code is correct.
note: This is the only item the original UAT honestly should have marked as PASS.

### 13. Tmux Pane Execution Path (09-05)
expected: Tmux submode executes via `tmux split-window` + `opencode attach`
result: CODE EXISTS — `lifecycle-tmux-runner.ts:56-70, 158` and `lifecycle-manager.ts:408, 562`
note: No test file exists for `lifecycle-tmux-runner.ts`. This path has NEVER been tested, not even with mocks.

### 14. Tmux Hard-Failure on Unavailable (09-05)
expected: Error thrown when tmux requested but unavailable
result: CODE EXISTS — `lifecycle-manager.ts:410-411, 564-565`
note: Error string exists at correct locations. Behavior verified only in `background-manager-harden.test.ts` which uses a mocked lifecycle manager.

### 15. No run_in_background References Remain
expected: Zero matches for `run_in_background` in `src/`
result: pass
evidence: `grep -r "run_in_background" src/` returns zero matches

## Summary

total: 15
passed (code exists + works): 3 (tests 1, 2, 15 — build/typecheck/test-suite/cleanup)
code_exists_but_broken: 8 (tests 3, 5, 6, 7, 8, 9, 10, 11)
code_exists_untested: 3 (tests 4, 13, 14)
fabricated_issue: 1 (test 12 — bug doesn't exist, UAT falsely claimed it did)
pending: 0
skipped: 0
blocked: 0

## Test Reality Assessment

Of 604 passing tests:
- **~50** test real behavior (CompletionDetector state machine, BackgroundManager real process spawning, lifecycle manager real queue/continuity, core hooks real file persistence)
- **~200** test mock-heavy patterns that pass because mocks return expected values (delegate-task routing, background observer loop, process runner)
- **~354** test other modules not directly related to Phase 09

**No test anywhere in the suite spawns a real child session through the OpenCode SDK.**

## Gaps

### Critical Gaps (P0 — delegation is non-functional)

- truth: "Delegated sessions are only accepted as started when assistant has produced at least 1 thinking block and 2 tool calls"
  status: missing
  reason: No start gate exists. The observer trusts the first poll result.

- truth: "Polling uses incremental backoff (15s initial, +5s per cycle, 60s cap)"
  status: missing
  reason: Fixed 3s interval with no backoff.

- truth: "Completion requires the LAST message to be an assistant output, verified across 2 consecutive polls"
  status: missing
  reason: Completion triggers on any "idle" status + non-zero message count + stability timer (which is bypassed by cached events).

- truth: "180s idle timeout with retry (up to 2 retries, same session ID)"
  status: missing
  reason: No retry mechanism. Errors are terminal. 30-minute hard timeout with no retry.

- truth: "Parent session coordinates — cannot close until all delegations complete AND all front-facing user tasks complete"
  status: missing
  reason: Fire-and-forget pattern. Parent has no coordination mechanism.

- truth: "Evidence counting excludes user/system messages — only assistant messages count"
  status: failed
  reason: `getCombinedEvidenceCount()` counts ALL messages including the initial prompt.

- truth: "CompletionDetector stability timer cannot be bypassed by premature events"
  status: failed
  reason: Cached `session.idle` events from before the observer starts watching bypass the timer.

### Important Gaps (P1 — incorrect behavior)

- truth: "'started' notifications say 'started', not 'completed'"
  status: failed
  severity: P1
  reason: `notification-handler.ts:113` has no "started" branch, defaults to "completed work on..."
  artifacts: [src/lib/notification-handler.ts]

- truth: "checkSessionExists returns 'unknown' for unrecognized status, not 'busy'"
  status: failed
  severity: P1
  reason: Defaults to "busy" at `lifecycle-background-observer.ts:87`
  artifacts: [src/lib/lifecycle-background-observer.ts]

### Uncovered Requirements

- PH09-01, PH09-02, PH09-04, PH09-05: Not in REQUIREMENTS.md (orphan requirements tracked only in plan frontmatter)
- Only PH09-03 has a formal REQUIREMENTS.md entry
- 11 of 15 UAT items map to untracked requirements, not formal specifications

## Required Actions

1. Re-plan Phase 09 with 10 new plans (see `delegation-completion-root-cause-2026-04-10.md`)
2. Rewrite mock-heavy tests to validate real behavior
3. Add missing requirements (PH09-01/02/04/05) to REQUIREMENTS.md
4. Implement user-specified completion detection logic (start gate, backoff polling, true completion, failure handling, parent coordination)
5. Fix all 5 identified bugs before any Phase 09 work is considered "complete"
