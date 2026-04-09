# Delegation False-Success & Tool Anomalies: Focused Diagnostic

**Date:** 2026-04-09  
**Session:** `ses_29126e4d3ffehn0T4QiwUM74FH`  
**Classification:** CRITICAL — Root cause identified, two independent bugs confirmed  
**Companion report:** `harness-comprehensive-diagnostic-2026-04-09.md`

---

## Executive Summary

The `delegate-task` tool suffers from **two independent bugs** that together produce a "false success" pattern: the tool returns `ok: true` with detailed lifecycle metadata, but **zero actual work is ever performed**.

1. **Bug A (Session-Scoping Mismatch):** Background tasks are stored with the CHILD session ID as `parentSessionID`, making them invisible to the `background` tool which queries by the PARENT session ID.
2. **Bug B (builtin-process is a NO-OP):** The `builtin-process` submode spawns a Node.js process that merely echoes the prompt text to stdout — it never invokes the OpenCode SDK or sends the prompt to an agent.

Even if Bug A is fixed (tasks become visible), Bug B means they'd still produce no useful output. **Both must be fixed for delegation to function.**

Additionally, 3 dead Zod schemas reference a mythical "prompt-enhance pipeline" that was never fully built, and the `tool.execute.after` hook amplifies false successes by injecting ~500-800 tokens of metadata per phantom response.

---

## Bug A: Session-Scoping Mismatch (CRITICAL)

### Code Path (with line numbers)

```
delegate-task.ts:233     execute()
  → lifecycleManager.launchDelegatedSession()
      ↓
lifecycle-manager.ts:205  launchDelegatedSession()
      ↓ (L346) submode === "builtin-process" → YES
      ↓ (L217-223) Creates CHILD session → args.sessionID = CHILD ID
      ↓
lifecycle-process-runner.ts:142  runLifecycleProcessTask()
      ↓ (L149) backgroundManager.spawn({ parentSessionID: args.sessionID })
      ↓                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      ↓                                    BUG: args.sessionID is CHILD, not PARENT
      ↓
      ↓ Returns buildAsyncProcessResponse() with ok:true
      ↓
background/index.ts:95    background tool → listTasks(sessionID)
      ↓ sessionID = PARENT session (from tool context)
      ↓ Filter: record.parentSessionID === parentSessionID
      ↓ "CHILD_ID" === "PARENT_ID" → false → EMPTY ARRAY
```

### Root Cause

**File:** `src/lib/lifecycle-process-runner.ts`, line 149

```typescript
// CURRENT (BUG):
const task = args.backgroundManager.spawn({
  ...
  parentSessionID: args.sessionID,  // ← CHILD session ID
})

// CORRECT:
parentSessionID: args.parentSessionID,  // ← ACTUAL parent session ID
```

The parameter is named `parentSessionID` but receives `args.sessionID`, which at this point in the call chain is the **child session** created at `lifecycle-manager.ts:217-223`. The actual parent is available as `args.parentSessionID`.

**Contrast with correct usage:** `buildAsyncProcessResponse()` at line 183 correctly uses `args.parentSessionID` for the JSON response field.

### Impact on `getOwnedTask` (status/cancel/wait)

**File:** `src/tools/background/index.ts`, lines 39-49

```typescript
function getOwnedTask(..., sessionID: string): BackgroundTask {
  const task = backgroundManager.getTask(taskID)
  if (!task || task.parentSessionID !== sessionID) {
    throw new Error("[Harness] Background task not found.")
  }
  return task
}
```

Even with a valid `task_id`, the ownership check `task.parentSessionID !== sessionID` fails because `task.parentSessionID` holds the child session ID while `sessionID` is the parent's. This is why `background status` and `background wait` both return "not found."

### Fix

Single-line change in `src/lib/lifecycle-process-runner.ts:149`:

```typescript
parentSessionID: args.parentSessionID,  // was: args.sessionID
```

This alone fixes `listTasks()`, `getOwnedTask()`, and all background operations.

---

## Bug B: builtin-process is a NO-OP (CRITICAL)

### Code Path

```
lifecycle-manager.ts:346  submode === "builtin-process"
  → runLifecycleProcessTask()
      ↓
lifecycle-process-runner.ts:38-58  buildBuiltinProcessCommand()
      ↓ Returns: node -e "process.stdout.write(process.env.HARNESS_DELEGATION_PROMPT)"
      ↓ This just ECHOS THE PROMPT TEXT. Never calls OpenCode SDK.
```

### Root Cause

**File:** `src/lib/lifecycle-process-runner.ts`, lines 38-58

```typescript
function buildBuiltinProcessCommand(promptText: string) {
  return {
    command: "node",
    args: ["-e", [
      'const prompt = process.env.HARNESS_DELEGATION_PROMPT ?? "";',
      'if (shouldFail) { process.stderr.write(prompt); process.exit(1); }',
      'process.stdout.write(prompt);',  // ← Just echoes the prompt text!
    ].join(" ")],
    env: { HARNESS_DELEGATION_PROMPT: promptText, ... },
  }
}
```

The process:
1. Reads the delegation prompt from `HARNESS_DELEGATION_PROMPT` env var
2. Writes it to stdout (or stderr if `OPENCODE_HARNESS_BUILTIN_PROCESS_FAIL=1`)
3. Exits

**It never calls the OpenCode SDK. It never sends the prompt to an agent.** The process completes "successfully" by outputting the raw prompt string — meaningless output.

### Why This Matters

Even after fixing Bug A (tasks become visible), the `builtin-process` submode would produce output like:

```
"Research all skills in .opencode/skills/ and produce a pair-mapping analysis..."
```

...which is just the prompt text, not any actual analysis.

### Fix Options

**Option 1 (Quick fix):** Route `builtin-process` to `builtin-subsession`:

```typescript
// lifecycle-manager.ts:346 — route all to subsession until builtin-process has real logic
return await runLifecycleSubsessionTask({ ... })
```

**Option 2 (Proper fix):** Implement real execution in `buildBuiltinProcessCommand()` that calls `sendPrompt()` to the child session, similar to what `runLifecycleSubsessionTask()` does.

**Option 3 (Strategic):** Deprecate `builtin-process` entirely. `builtin-subsession` already handles real execution via OpenCode SDK. The process mode was designed for tmux-fallback scenarios but the stub was never completed.

---

## Bug C: `kill()` TOCTOU Race Condition (MEDIUM)

**File:** `src/lib/background-manager.ts`, line 222

```typescript
record.status = "killed"  // Set BEFORE signal sent
try { record.process.kill("SIGTERM") } catch {}
```

The `close` handler at line 293 checks `if (record.status === "running")` but by that point status is already `"killed"`, so the exit code capture path is skipped.

### Fix

Move `status = "killed"` assignment into the `close` handler, or use a separate `killRequested` boolean.

---

## Tool Registration Audit

### Inventory: 5 Registered Tools

| Tool | File | Description | Status |
|------|------|-------------|--------|
| `background` | `src/tools/background/index.ts` | Manage background processes | **BROKEN** — can't find tasks due to Bug A |
| `delegate-task` | `src/tools/delegate-task.ts` | Create restricted child sessions | **BROKEN** — false success (Bug A + B) |
| `prompt-skim` | `src/tools/prompt-skim/tools.ts` | Fast scan of prompt content | **WORKING** |
| `prompt-analyze` | `src/tools/prompt-analyze/tools.ts` | Analyze prompt for issues | **WORKING** |
| `session-patch` | `src/tools/session-patch/tools.ts` | Patch sections in session file | **WORKING** (but unbounded file access) |

### Dead Schemas (No Producing Tool)

| Schema | File:Line | Status |
|--------|-----------|--------|
| `ContextBudgetRecordSchema` | `prompt-enhance.schema.ts:83-93` | Dead — no `context-budget` tool |
| `EnhancedPromptOutputSchema` | `prompt-enhance.schema.ts:125-140` | Dead — no pipeline tool |
| `PipelineStateSchema` | `prompt-enhance.schema.ts:150-168` | Dead — references 6 pipeline phases that don't exist |

These reference a mythical "prompt-enhance pipeline" with phases: skim → bridge → investigation → clarification → repackage → report. Only `skim` and `analyze` (partial `investigation`) were built.

### Naming Anomalies

| Finding | Severity |
|---------|----------|
| `doom_loop` permission in `opencode.json` | **NOT a harness feature** — OpenCode platform's loop detector, correctly set to `"allow"` |
| 3 dead `Action` types (`"execute"` literal, never used) | LOW — dead code |
| `background` is generic single-word name | LOW — cosmetic |

### No Dead Registered Tools

All 5 tools have session evidence of invocation. The gap is not dead tools but the **false-success contract**: `delegate-task` returns session metadata as "success" before the child session has completed its work.

---

## Context Budget Waste Analysis

### Session Token Breakdown

| Category | Tool Calls | Estimated Tokens |
|----------|-----------|-----------------|
| Productive (real work output) | 16 of 37 | ~35,000-40,000 |
| Dead-end searches | 4 | ~2,000 |
| Category validation errors | 2 | ~400 |
| **False-success delegate-task** | **4** | **~12,800** |
| Lost background checks | 4 | ~1,200 |
| `tool.execute.after` metadata on phantom calls | 21 calls | ~10,500 |
| Compaction metadata overhead | 1 event | ~4,000 |
| Aborted task calls | 2 | ~400 |
| **Total waste** | **21 of 37 (57%)** | **~32,300 tokens** |

**Waste ratio: ~45% of session context was phantom/noise.**

### The Amplification Pattern

The `tool.execute.after` hook **amplifies** false successes by injecting ~500-800 tokens of metadata per response. On the 4 phantom delegate-task responses, this metadata was the ONLY substantive-looking content — creating a convincing illusion of progress:

```json
{
  "_harness": {
    "totalToolCalls": 18,
    "rootSessionID": "ses_...",
    "delegationDepth": 1,
    "lifecycle": { "phase": "running" },
    "continuityStatus": "loaded",
    "governance": { "action": "allow" },
    ... // ~30 more fields
  }
}
```

The orchestrator consumed this as evidence that "specialists were running" when in fact nothing was happening.

---

## Delegation Timeline: The 6 Calls

| # | Time | Category | Result | Task ID | Outcome |
|---|------|----------|--------|---------|---------|
| 1 | ~2430 | `analysis` ❌ | ERROR: Invalid category | — | Blocked by governance (correct behavior) |
| 2 | ~2447 | `analysis` ❌ | ERROR: Invalid category | — | Same error, same invalid category |
| 3 | ~2488 | `research` ✅ | ok:true, phase:running | `bg_1_1775681398648` | **LOST** — background list returns [] |
| 4 | ~2550 | `research` ✅ | ok:true, phase:running | `bg_2_1775681398663` | **LOST** — background status "not found" |
| 5 | ~2811 | `research` ✅ | ok:true, phase:running | `bg_3_1775681480968` | **LOST** — retry same pattern |
| 6 | ~2873 | `research` ✅ | ok:true, phase:running | `bg_4_1775681481022` | **LOST** — retry same pattern |

**Total work produced by all 6 calls: ZERO.**  
**Total context consumed: ~16,000 tokens** (error responses + false-success JSON + background checks).

---

## Recommended Fix Priority

| Priority | Bug | Effort | Impact |
|----------|-----|--------|--------|
| **P0** | Bug A: `parentSessionID` mismatch | 1 line | Background tasks become visible to parent |
| **P0** | Bug B: `builtin-process` NO-OP | Route 1 line, or ~50 LOC for real implementation | Delegation actually executes work |
| **P1** | Bug C: `kill()` TOCTOU race | ~5 lines | Clean task cancellation |
| **P2** | Dead schemas cleanup | Delete ~60 lines | Remove dead code bloat |
| **P2** | `tool.execute.after` metadata reduction | ~20 lines | Reduce context pollution from 800 to ~200 tokens per response |
| **P3** | `session-patch` path sandboxing | ~10 lines | Prevent arbitrary file mutation |
| **P3** | Dead `Action` types removal | Delete 3 lines | Code hygiene |

---

## Verification Checklist (for dev team)

- [ ] Fix Bug A: Change `parentSessionID: args.sessionID` → `args.parentSessionID` in `lifecycle-process-runner.ts:149`
- [ ] Fix Bug B: Route `builtin-process` to `runLifecycleSubsessionTask` or implement real execution
- [ ] Run: `delegate-task` → verify `background list` shows the task
- [ ] Run: `background status <id>` → verify task is found and shows real output
- [ ] Run: `background wait <id>` → verify it completes with actual work product
- [ ] Verify: output files created at target paths
- [ ] Fix Bug C: `kill()` race condition in `background-manager.ts`
- [ ] Clean up: Remove 3 dead schemas from `prompt-enhance.schema.ts`
- [ ] Consider: Reduce `tool.execute.after` metadata injection volume
- [ ] Consider: Add path validation to `session-patch` tool

---

*End of focused diagnostic. Generated by subagent investigation, validated by cross-reference of source code and session export evidence.*
