# Post-Fix Diagnostic Update: HiveMind V3 Harness Delegation Chain

> **Date:** 2026-04-09
> **Scope:** Comparison of pre-fix diagnostic findings vs post-fix trial run results
> **Evidence Sources:** `attempt-fix-1.md` (fix session), `trialrun-after-fix-1.md` (trial run)
> **Previous Reports:** `delegation-false-success-tool-anomalies-2026-04-09.md`, `harness-comprehensive-diagnostic-2026-04-09.md`
> **Companion Report:** `forensic-delegation-failures-2026-04-09.md` (trial run evidence analysis)

---

## Executive Summary

The debug team applied targeted fixes for the three bugs identified in our initial diagnostic (Bug A: session-scoping mismatch, Bug B: builtin-process no-op, Bug C: TOCTOU race). A trial run was then conducted to validate the fixes.

**Result: The delegation system still has 0% success rate.** Of 19 tool invocations (9 delegate-task, 8 background, 2 task tool), zero produced successful output. The core "false success" pattern persists, and new failure modes were exposed.

**Critical finding: All applied fixes exist only as unstaged working-tree changes.** If the worktree is cleaned or reset, every fix is lost. This must be addressed immediately.

---

## Pre-Fix vs Post-Fix Comparison

### Bug A: Session-Scoping Mismatch — `parentSessionID: args.sessionID`

| Aspect | Pre-Fix | Post-Fix |
|--------|---------|----------|
| **Status** | BROKEN | FIXED |
| **Location** | `lifecycle-process-runner.ts:149` | Same file, line 149 |
| **Root Cause** | `args.sessionID` used instead of `args.parentSessionID` | Now correctly passes `args.parentSessionID` |
| **Committed** | N/A | **NO — unstaged change** |
| **Impact if lost** | Parent-child session linkage broken, orphan sessions accumulate | Reverts to broken state |

**Verdict:** Fix is correct. Must be committed immediately.

---

### Bug B: builtin-process is a NO-OP — echo stub

| Aspect | Pre-Fix | Post-Fix |
|--------|---------|----------|
| **Status** | BROKEN | NEUTRALIZED |
| **Mechanism** | `builtin-process` submode spawned `/bin/echo` (no-op shell command) | `resolveEffectiveExecutionMode()` force-reroutes `builtin-process` → `builtin-subsession` |
| **Location** | `lifecycle-manager.ts:57-69` | Same file, lines 57-69 |
| **Removed code** | `if (args.execution.submode === "builtin-process")` block in lifecycle-manager | Removed from lifecycle-manager |
| **Dead code remaining** | N/A | `runLifecycleProcessTask`, `buildBuiltinProcessCommand`, `finalizeProcessResult`, `buildAsyncProcessResponse` still exist in `lifecycle-process-runner.ts` |
| **Committed** | N/A | **NO — unstaged change** |

**Verdict:** Reroute is correct as a mitigation. Dead code must be cleaned up. The underlying problem (process-based execution model is fundamentally broken) is sidestepped, not solved.

---

### Bug C: `kill()` TOCTOU Race

| Aspect | Pre-Fix | Post-Fix |
|--------|---------|----------|
| **Status** | SUSPECTED | FALSE POSITIVE |
| **Analysis** | Initial diagnostic flagged potential TOCTOU in `background-manager.ts:216-241` | Deep analysis confirms Node.js single-thread model prevents the race. Status-set-before-signal ordering is correct. Close handler respects non-running status. SIGKILL safety net works. |
| **Fix needed** | Unknown | **No fix needed** |

**Verdict:** False positive. No action required.

---

## New Issues Discovered Post-Fix

### Issue 1: All Critical Fixes Are UNCOMMITTED (SEVERITY: CRITICAL)

**Files with unstaged fix changes:**

| File | Change | Bug Addressed |
|------|--------|---------------|
| `lifecycle-process-runner.ts` | Line 149: `args.parentSessionID` | Bug A |
| `lifecycle-manager.ts` | Lines 57-69: force-reroute `builtin-process` → `builtin-subsession` | Bug B |
| `completion-detector.ts` | Null guard for `feedMessageCount` | New fix |
| `concurrency.ts` | +259 lines: priority queue, timeout-based acquire | New feature |
| `plugin.ts` | Integration changes | All |

**Risk:** `git checkout`, `git reset`, or `git clean` destroys all fixes.
**Action:** Commit all working-tree changes immediately with descriptive messages.

---

### Issue 2: Background Timeout Kills Valid Work (SEVERITY: HIGH)

**Location:** `background-manager.ts:162-167`
**Mechanism:** Default 5-minute timeout applies to all background tasks. Tasks exceeding this are killed.
**Amplified by:** `lifecycle-background-observer.ts:122-144` — `pollTimeoutMs` controls a secondary completion timeout. Observer marks task as "failed" when polling times out.

**Trial Evidence:** In `trialrun-after-fix-1.md`, 2 background delegation attempts were declared "failed" — likely timed out before the child session even started processing.

**Action:** Either increase default timeout or make it configurable per task. Long-running research/analysis tasks routinely exceed 5 minutes.

---

### Issue 3: No "Started" Signal for Background Tasks (SEVERITY: HIGH)

**Location:** `lifecycle-process-runner.ts:232-283`
**Mechanism:** Background tasks return JSON response immediately (`ok: true, phase: "running"`) but never notify the parent that execution actually began. Only completion/failure notifications exist (via `notifyParentSession` in `lifecycle-background-observer.ts`).

**Trial Evidence:** Parent sessions showed "will wait for background task" but had no way to verify the child was actually running. Combined with the timeout issue, this creates a blind spot where tasks appear to be running but have already failed.

**Action:** Add a "task_started" notification that fires when the child session begins its first tool call. This gives the parent confirmation that work is actually happening.

---

### Issue 4: Stream Cutoff — Agent Abandons Wait (SEVERITY: HIGH)

**Location:** Not in harness source — likely in OpenCode platform layer or hook chain.
**Mechanism:** The orchestrating agent says "I will wait for the background task" but the session stream ends shortly after. The agent's thinking shows a pattern: false-confidence → discovery of no output → retry-death-spiral → surrender.

**Trial Evidence:** In `trialrun-after-fix-1.md`, 2 instances of the agent declaring it would wait, then the session ending with no output produced.

**Hypotheses:**
1. `create-session-hooks.ts` auto-loop retry logic interferes with waiting behavior
2. `create-tool-guard-hooks.ts` circuit breaker terminates the session
3. OpenCode platform-level timeout on idle sessions
4. Token budget exhaustion in the orchestrating session

**Action:** Investigate hook chain for premature session termination. Check circuit breaker thresholds in plugin.ts.

---

### Issue 5: Premature Completion Detection (SEVERITY: MEDIUM)

**Location:** `completion-detector.ts:26,98-111`
**Mechanism:** 10-second stability timer. If child session pauses tool use for >10 seconds (e.g., waiting for an API response, thinking through a complex problem), stability detection signals "idle" and may trigger premature completion.

**Impact:** Background tasks could be declared "complete" while still working, leading to empty output files.

**Action:** Increase stability timer to 60 seconds, or make it configurable. Add heartbeat mechanism for long-running tasks.

---

### Issue 6: Dead Code Not Cleaned Up (SEVERITY: LOW)

**Location:** `lifecycle-process-runner.ts`
**Dead functions:** `runLifecycleProcessTask`, `buildBuiltinProcessCommand`, `finalizeProcessResult`, `buildAsyncProcessResponse`
**Context:** Bug B fix rerouted `builtin-process` to `builtin-subsession`, making the process-runner code unreachable.

**Action:** Remove dead code in a cleanup commit. Keep the file for its remaining active functions (subsession launch, background task setup).

---

### Issue 7: delegate-task Schema Complexity (SEVERITY: MEDIUM)

**Location:** `delegate-task.ts` (262 LOC)
**Mechanism:** 9 required parameters, complex validation chain, `walkParentChain()` at line 202 performs sequential SDK calls before delegation starts. LLMs struggle to produce valid first-try invocations.

**Trial Evidence:** 3 of 9 delegate-task calls failed on first attempt due to invalid `category` or `agent` parameters. On retry with corrected parameters, they hit the false-success pattern.

**Action:** Reduce required parameters. Add parameter examples in tool description. Consider a simplified "quick delegate" mode with defaults.

---

## Root Cause Cascade (Post-Fix)

```
delegate-task called with valid params
→ concurrency slot acquired
→ builtin-subsession submode selected (Bug B reroute active)
→ session spawned via SDK
→ returns ok:true, phase:"running" to caller
→ NO "started" signal sent to parent (Issue 3)
→ parent session waits blindly
→ child session may timeout (Issue 2) or completion detector fires prematurely (Issue 5)
→ OR: stream cuts off at platform level (Issue 4)
→ parent session ends with no output
→ 0% success rate
```

The false-success pattern persists because the fixes addressed *how* sessions are spawned (Bug A, Bug B) but not *what happens after* the spawn call returns. The delegation chain has no observability between "spawned" and "completed."

---

## Trial Run Failure Statistics

**Session:** `trialrun-after-fix-1.md` (MiniMax M2.7, skills audit Cycle 2)

| Tool | Calls | Success | Failure | Rate |
|------|-------|---------|---------|------|
| delegate-task | 9 | 0 | 9 | 0% |
| background (all subcommands) | 8 | 0 | 8 | 0% |
| task (fallback) | 2 | 0 | 2 | 0% |
| **Total** | **19** | **0** | **19** | **0%** |

**Failure Breakdown:**

| ID | Category | Severity | Count |
|----|----------|----------|-------|
| F-01 | First-try validation failure (invalid category/agent) | Medium | 3 |
| F-02 | False-success — `ok:true` but task never runs | **CRITICAL** | 6 |
| F-03 | No-signal — background system completely blind | High | All |
| F-04 | Stream cutoff — agent says "will wait" but session ends | High | 2 |
| F-05 | Background timeout — tasks declared failed without running | High | 2 |
| F-06 | Task tool abort — last-resort fallback also fails | Medium | 2 |

---

## Prioritized Action List for Debug Team

### Immediate (Blocks All Other Work)

| # | Action | File(s) | Rationale |
|---|--------|---------|-----------|
| 1 | **Commit all working-tree fixes NOW** | `lifecycle-process-runner.ts`, `lifecycle-manager.ts`, `completion-detector.ts`, `concurrency.ts`, `plugin.ts` | Fixes exist only as unstaged changes — one `git checkout` destroys all progress |
| 2 | **Add "task_started" notification** | `lifecycle-process-runner.ts`, `lifecycle-background-observer.ts` | Parent has zero observability into child execution state |
| 3 | **Increase background timeout default** | `background-manager.ts:162-167` | 5-minute default kills valid long-running tasks |

### High Priority (Next Sprint)

| # | Action | File(s) | Rationale |
|---|--------|---------|-----------|
| 4 | **Increase completion stability timer** | `completion-detector.ts:26` | 10 seconds is too aggressive — 60 seconds minimum |
| 5 | **Investigate stream cutoff** | Hook chain (`create-session-hooks.ts`, `create-tool-guard-hooks.ts`), OpenCode platform | Agent abandons wait — unclear if harness or platform causes |
| 6 | **Simplify delegate-task schema** | `delegate-task.ts` | 9 params with complex validation = LLM can't succeed first try |

### Cleanup (Technical Debt)

| # | Action | File(s) | Rationale |
|---|--------|---------|-----------|
| 7 | **Remove dead process-runner code** | `lifecycle-process-runner.ts` | `runLifecycleProcessTask` and helpers are unreachable after Bug B reroute |
| 8 | **Verify agent-registry removal** | Check all imports | `agent-registry.ts` deleted in working tree but may be imported elsewhere |

---

## What Worked

1. **Bug A fix is correct** — `args.parentSessionID` properly links parent-child sessions
2. **Bug B reroute is effective** — `builtin-process` → `builtin-subsession` avoids the echo-stub no-op entirely
3. **New modules are solid** — `execution-mode.ts`, `specialist-router.ts`, `lifecycle-state.ts`, `lifecycle-queue.ts`, `lifecycle-runtime-policy.ts`, `lifecycle-background-observer.ts`, `categories.ts` are all committed and structurally sound
4. **Bug C was a false positive** — no fix needed, saving debug effort

## What Worsened or Is New

1. **Uncommitted fixes** — the most critical risk. All fixes are one command away from being lost
2. **Background timeout** — now visible because sessions actually spawn (Bug A fix worked), but they time out before completing
3. **No observability** — the delegation chain has a blind spot between "spawned" and "completed" — no started, progress, or heartbeat signals
4. **Stream cutoff** — not a harness bug per se, but the hook chain may be contributing to premature session termination
5. **Schema complexity** — the fix attempt didn't address the root usability problem: delegate-task is too hard for LLMs to invoke correctly

---

## Appendix: Files Modified (Uncommitted)

```
Changes not staged for commit:
  src/lib/lifecycle-process-runner.ts  — Bug A fix (line 149)
  src/lib/lifecycle-manager.ts          — Bug B reroute (lines 57-69), removed import
  src/lib/completion-detector.ts        — Null guard for feedMessageCount
  src/lib/concurrency.ts               — +259 lines (priority queue, timeout acquire)
  src/plugin.ts                        — Integration changes
```

## Appendix: New Modules Added (Committed)

| Module | LOC | Purpose |
|--------|-----|---------|
| `execution-mode.ts` | ~180 | D-12/D-13 execution mode classifier |
| `specialist-router.ts` | ~145 | Advisory specialist route resolution |
| `lifecycle-state.ts` | ~85 | Lifecycle state builder + transition validation |
| `lifecycle-queue.ts` | ~95 | Queue acquire/enqueue/waiting management |
| `lifecycle-runtime-policy.ts` | ~65 | Per-key concurrency policy resolution |
| `lifecycle-background-observer.ts` | ~110 | Background completion observation |
| `compaction-checkpoint.ts` | ~140 | Checkpoint save/restore |
| `categories.ts` | ~100 | Delegation category definitions |

---

*End of report. For questions or follow-up investigation requests, reference this document as `post-fix-diagnostic-update-2026-04-09.md`.*
