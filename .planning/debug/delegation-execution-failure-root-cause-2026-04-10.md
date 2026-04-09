# Root Cause Analysis: Two Independent Delegation Failures

**Date:** 2026-04-10
**Sessions:** `session-ses_28bd_json_parser_error.md`, `session-ses_28bd_unknown_error.md`
**Analyst:** Orchestrator investigation

---

## Failure 1: JSON Parse Error — `run_in_background: false` Crashes TUI

### Symptoms
- `delegate-task` with `run_in_background: false` produces `JSON Parse error: Unexpected EOF`
- Error cascades across 5+ consecutive calls
- TUI renders raw error text (UI terminal error)
- Session continues but delegate-task is effectively unusable in synchronous mode

### Root Cause
**The `delegate-task` tool's synchronous mode (`run_in_background: false`) produces output that the OpenCode JSON parser cannot handle.**

When `run_in_background: false`, the tool likely:
1. Waits for the child session to complete synchronously
2. Returns a large JSON payload with the session results
3. The payload is either:
   - Malformed (missing closing brace, unescaped quotes)
   - Truncated (output buffer overflow, timeout mid-stream)
   - Contains embedded markdown/code blocks that break JSON parsing

### Why It's Sticky
- This has happened in multiple sessions
- The LLM tries to "fix" the JSON by reformatting the input — doesn't help
- The LLM tries `task` tool instead — also fails (`Tool execution aborted`)
- All JSON parsing errors are `Unexpected EOF` — suggests the parser receives incomplete input

### Impact
- **CRITICAL**: Any synchronous delegation crashes the session
- Forces all delegation to `run_in_background: true` (async)
- When LLM tries sync as fallback, it gets trapped in infinite error loop

---

## Failure 2: Unknown Error — Async Queue Returns "Complete" in 16ms With No Work Done

### Symptoms
- `delegate-task` with `run_in_background: true` returns `ok: true` immediately
- Builder notification fires in **16ms** — impossibly fast for real work
- When notification arrives: "Builder completed work on..." — but `git log` shows no commits from the builder
- `git status` shows only unrelated file modifications
- Session shows "queue returned immediately showing as complete but no tasks run"

### Root Cause
**The async delegation path creates a child session but the child session never executes — it terminates immediately due to one of:**

1. **Agent routing mismatch**: Requested `agent: "build"` but the harness maps it to `"builder"` via alias. The alias mapping works for validation, but the **actual OpenCode task tool** (underlying `session.promptAsync()`) may not recognize "build" as a valid agent name — it needs the canonical agent name from `opencode.json`.

2. **Child session lifecycle crash**: The child session is created but immediately terminates because:
   - The agent profile doesn't exist in OpenCode's agent registry
   - The session gets created with zero content and immediately completes
   - The notification fires on session creation, not session completion

3. **Silent timeout**: The child session starts but times out before doing any work. The 16ms duration suggests the notification fires on session **creation** rather than on **completion**.

### Why It's Sticky
- The harness reports `ok: true` — false success
- The LLM trusts the harness output and proceeds
- No error feedback loop — the LLM has no way to know the child didn't execute
- `session://ses_xxx` links are provided but contain empty/minimal content

---

## The Common Thread: Tech Stack Mismatch

### What the Harness Thinks It Does
```
delegate-task → validate agent → map alias → call session.promptAsync() → return ok:true → notification on complete
```

### What Actually Happens
```
delegate-task → validate agent → map alias → call session.promptAsync() → ??? → immediate termination or parser crash
```

### Missing Links
1. **No child session verification**: The harness doesn't verify the child session actually started executing
2. **No sync mode fallback**: When sync mode crashes, there's no graceful degradation
3. **No async completion verification**: When async mode "completes" in 16ms, no one checks if work was done
4. **No error propagation**: The LLM sees `ok: true` and assumes success

---

## Fix Strategy (NOT patches — systemic solution)

### For Failure 1 (JSON Parser):
- **Never use `run_in_background: false`** — it's broken at the parser level
- The tool should either:
  a. Remove sync mode entirely, or
  b. Return a structured response that's guaranteed to be valid JSON
  c. Wrap sync output in a markdown code block with proper escaping

### For Failure 2 (Silent Crash):
- **Verify child session execution**: After `promptAsync()` returns, poll the child session's message count or tool call count to confirm it actually ran
- **Minimum duration gate**: If a session "completes" in <100ms, flag it as suspicious
- **Agent name verification**: Confirm the aliased agent name matches what OpenCode's task tool actually accepts
- **Graceful degradation**: If the child fails to start, return an error (not `ok: true`)

### For the Tech Stack Question:
**Are we applying the correct tech stacks?**

The current `delegate-task` tool uses:
- `session.promptAsync()` — correct for background delegation (confirmed in prior debug session)
- Custom JSON response format — this is where the parser breaks
- Agent aliasing (`build`→`builder`) — validated but may not reach the underlying OpenCode task tool correctly

The issue is NOT the tech stack choice — `promptAsync()` is correct. The issue is:
1. **Output format**: The JSON response from sync mode is malformed
2. **Execution verification**: Async mode doesn't verify the child actually executed
3. **Agent name propagation**: The alias maps correctly in validation but may not reach the underlying task tool

---

## Evidence Links

| Session | Failure | Duration | Files |
|---------|---------|----------|-------|
| `session-ses_28bd_json_parser_error.md` | JSON Parse error (sync) | N/A | All delegate-task calls with `run_in_background: false` |
| `session-ses_28bd_unknown_error.md` | Silent crash (async) | 16ms | Builder-A, Builder-B, Builder-C all returned "complete" with no commits |

## Prior Fixes That Didn't Help
- Adding `build`, `plan`, `explore` to VALID_AGENTS — allows validation to pass, but doesn't fix execution
- Making categories optional — prevents throwing, but doesn't fix execution
- Agent alias mapping — maps correctly in validation, but underlying task tool may need canonical names
