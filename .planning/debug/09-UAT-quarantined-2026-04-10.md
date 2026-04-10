---
status: complete
phase: 09-sticky-delegation-corrective
source:
  - 09-01-SUMMARY.md
  - 09-02-SUMMARY.md
  - 09-03-SUMMARY.md
  - 09-04-SUMMARY.md
  - 09-05-SUMMARY.md
started: 2026-04-10T20:00:00Z
updated: 2026-04-10T20:30:00Z
---

## Current Test

[testing complete — dry-scan validation]

## Tests

### 1. Build + Typecheck Pass
expected: `npm run build` and `npm run typecheck` both succeed with no errors
result: pass
evidence: Both commands completed with exit 0, zero errors

### 2. Full Test Suite Pass
expected: `npm test` returns 604+ passing tests, 0 failures
result: pass
evidence: 604 passed, 1 skipped, 1 todo across 39 test files in 4.14s

### 3. Stable Evidence Completion (09-01)
expected: Builtin-subsession completion waits for combined messages.length + tool-call parts evidence before marking an idle child session done. Idle alone does not complete.
result: pass
evidence: CompletionDetector integrated at lifecycle-background-observer.ts:120, combined evidence via getCombinedEvidenceCount() at L54-58, zero-evidence skip at L186-188, stability gate at L192-199. Tests: L340-378 (zero-evidence rejection), L380-428 (stability path).

### 4. 3000ms Polling Cadence (09-01)
expected: Background observer polls at 3000ms intervals (not faster, not slower)
result: pass
evidence: DEFAULT_POLL_INTERVAL_MS = 3000 at L32, used in all sleep paths. Tests assert every sleep call is exactly 3000ms (L376, L427).

### 5. Zero-Evidence Idle Rejection (09-01)
expected: When observer detects idle but session has zero messages/tool-calls, completion is NOT triggered
result: pass
evidence: L186-188 skips when combinedEvidenceCount <= 0. Test at L340-378: idle with empty messages → patchLifecycle NOT called.

### 6. Notification Replay on Parent Create (09-02)
expected: When parent session is created, pending notifications from continuity replay as toasts
result: pass
evidence: create-core-hooks.ts L106-108: session.created + lifecycle.phase === "created" triggers replay. Test at L414.

### 7. Notification Replay on Parent Resume (09-02)
expected: When parent session resumes (session.updated with recovery state), pending notifications replay
result: pass
evidence: create-core-hooks.ts L108: session.updated + recovery.assessment.recommendedAction === "resume". Test at L470.

### 8. Exactly-Once Notification Clearing (09-02)
expected: After toast injection succeeds, pending notifications are cleared from continuity and do not reappear on next system.transform
result: pass
evidence: Clearing inside try block AFTER showToast (L119-129). Catch block preserves notifications on failure. Tests L464-467, L528 confirm no double-injection.

### 9. Sync Envelope Decoding (09-03)
expected: Sync delegation returns JSON `{output: "<base64>"}` that decodes via `Buffer.from(output, 'base64').toString('utf8')` to the original assistant text
result: pass
evidence: lifecycle-process-runner.ts L297-321: buildSyncSubsessionEnvelope wraps Buffer.from(output, "utf8").toString("base64"). Test lifecycle-process-runner.test.ts L48 decodes correctly.

### 10. Large Sync Response Parsing (09-03)
expected: Oversized sync output parses and decodes correctly without JSON parser errors
result: pass
evidence: delegate-task-overflow.test.ts L243-281: 180KB text roundtrips through envelope, decodes correctly.

### 11. async_dispatch Parameter Present (09-04)
expected: delegate-task tool schema uses `async_dispatch` (not `run_in_background`); tool description references `async_dispatch`
result: pass
evidence: delegate-task.ts L196 (type), L234-236 (schema), L218 (description). buildTaskCharacteristics reads args.async_dispatch at L134, L136, L143.

### 12. Dispatch Config Persistence (09-04)
expected: `defaultDispatchMode`, `tmuxAvailability`, `pollIntervalMs` are stored in session continuity metadata on launch
result: issue
reported: "Fields exist in types.ts L214-216 and are written on launch. However, continuity-normalizers.ts normalizeMetadata() does NOT normalize these fields, causing them to be silently dropped on store reload from disk. In-memory clones survive but process restarts lose dispatch config."
severity: major

### 13. Tmux Pane Execution Path (09-05)
expected: When `execution.submode === "tmux-pane"`, delegated session runs via `tmux split-window` + `opencode attach -s <sessionID>`, with process exit as completion signal (not message-count stability)
result: pass
evidence: lifecycle-tmux-runner.ts: buildTmuxCommand L56-70 constructs split-window command. runLifecycleTmuxTask L158 uses onComplete (process exit). lifecycle-manager.ts L408, L562: tmux-pane branch before builtin-subsession.

### 14. Tmux Hard-Failure on Unavailable (09-05)
expected: When `tmuxAvailability === "enabled"` but tmux is not detected, a `[Harness]` error is thrown (no silent fallback)
result: pass
evidence: lifecycle-manager.ts L410-411 (async), L564-565 (sync): throws `[Harness] tmux-pane execution requested without available tmux runner.` Test background-manager-harden.test.ts L840-897 confirms.

### 15. No run_in_background References Remain (09-04/09-05)
expected: `grep -r "run_in_background" src/` returns zero matches
result: pass
evidence: Zero matches in src/. Only test negative assertions and one stale test arg in specialist-routing.test.ts:96 remain.

## Summary

total: 15
passed: 14
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Dispatch config fields persisted in continuity metadata survive process restarts"
  status: failed
  reason: "continuity-normalizers.ts normalizeMetadata() drops defaultDispatchMode, tmuxAvailability, pollIntervalMs on reload — they are not in the normalization whitelist"
  severity: major
  test: 12
  artifacts: [src/lib/continuity.ts, src/lib/types.ts]
  missing: [normalization rules for new metadata fields]
  cross_component_warnings:
    - "tests/lib/specialist-routing.test.ts:96 uses stale run_in_background field name (should be async_dispatch) — test passes via Zod ignoring unknown fields but does not test intended behavior"
    - "Async response shapes inconsistent across 3 execution paths (builtin-subsession, builtin-process, tmux-pane) — missing fields in some responses"
