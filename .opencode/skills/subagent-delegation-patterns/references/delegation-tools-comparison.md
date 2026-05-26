# Delegation Tools — Extended Comparison

This reference provides the extended edge case comparison across all three delegation tools. Read when the Differentiation Matrix in SKILL.md does not cover your specific scenario.

## Table of Contents

1. [Feature-by-Feature Comparison](#feature-by-feature-comparison)
2. [Edge Cases by Tool](#edge-cases-by-tool)
3. [Mixed-Mode Workflows](#mixed-mode-workflows)
4. [Permission and Safety Considerations](#permission-and-safety-considerations)

## Tool Selection Principle

**`task` tool is always the preferred choice.** It handles 40+ consecutive tool calls perfectly, gives full user control (click to view progress), and works for EVERY use case — code editing, governance documents, artifact modifications. Its ONLY limitation: it blocks the caller.

**`delegate-task` is ONLY for async background execution.** Use when the agent needs to continue other work while a delegation runs. Use strictly for low-risk tasks: research, audit, review, verification — never for code editing.

**`execute-slash-command` is for command dispatch and agent override only.**

## Feature-by-Feature Comparison

| Feature | `task` tool | `delegate-task` | `execute-slash-command` |
|---------|------------|-----------------|------------------------|
| **Dispatch latency** | Low (native, in-process) | Medium (SDK child-session creation) | Low (inline or synthetic prompt) |
| **Caller blocking** | Blocks (waits for subagent) | Non-blocking (returns delegation ID) | Blocks (one-turn synthetic, or inline) |
| **Session hierarchy** | Auto-chained by runtime | Explicit via `parentSessionId` in context | No session hierarchy (one-shot) |
| **Multiple subagents** | Sequential (one at a time) | Parallel (dispatch multiple, check later) | Sequential (one command at a time) |
| **Output structure** | Unstructured (agent's final message) | Structured (state + output + error) | Unstructured (command response) |
| **Error handling** | Agent-caught errors; unclear propagation | Structured error state + message | Command-level error or synthetic failure |
| **Timeout behavior** | Inherits parent timeout | Configurable timeout per delegation | Immediate or parent session timeout |
| **Token budget** | Shared with parent | Per-delegation configurable | Shared with parent or command context |
| **Resumability** | `task_id` resume parameter | `parentSessionId` in context JSON | Not resumable (one-shot) |
| **Agent selection** | `subagent_type` parameter | `agent` parameter | `agent` + `subtask` parameters |
| **Command dispatch** | Not supported | Not supported | Primary purpose |
| **Tool access** | Full agent tool set | Full agent tool set | Agent-specific tool set |

## Edge Cases by Tool

### `task` tool edge cases

| Edge Case | Behavior | Recommendation |
|-----------|----------|----------------|
| Subagent exceeds token limit | Runtime may truncate output | `task` tool handles large outputs well (40+ calls); truncation rare in practice |
| Subagent does not return | Runtime times out | Set parent session timeout; consider splitting work |
| Same `task_id` reused across different agents | Unclear — may reset session | Create fresh `task_id` per agent type |
| Subagent makes tool errors | Errors propagate in output message | Inspect output for error patterns |
| Multiple parallel task dispatches | Not supported natively for task tool | Use sequential task dispatch, or switch to delegate-task ONLY for parallel research/audit (not code) |

### `delegate-task` edge cases

| Edge Case | Behavior | Recommendation |
|-----------|----------|----------------|
| Delegation ID lost or forgotten | Cannot poll or retrieve | Record delegation IDs in a persistent note |
| Parent session expired before child completes | Child may continue but hierarchy breaks | Dispatch from a durable parent session |
| Stale parentSessionId (nonexistent session) | Runtime may reject or create orphan | Verify via `session-tracker` before dispatching |
| `delegation-status` returns no data | Delegation ID may be wrong or from `task` tool | Verify correct tool was used; re-dispatch if needed |
| Multiple delegations to same agent | Each delegation is independent | Monitor each by ID; no cross-contamination |
| Delegation dispatched but never completed | Subagent may be stuck or budget exhausted | Check `delegation-status` for `error` or `timeout` |

### `execute-slash-command` edge cases

| Edge Case | Behavior | Recommendation |
|-----------|----------|----------------|
| Agent override name is misspelled | Command fails or defaults to current agent | Verify agent name via `configure-primitive list` first |
| Command body is empty or malformed | Runtime may produce a no-op prompt | Verify command via `hivemind-command-engine discover` first |
| `subtask: true` + command with arguments | Arguments injected into SubtaskPartInput | Ensure argument format matches command expectations |
| `subtask: false` + agent override | Synthetic parent prompt dispatched | Agent runs one turn, then restores to caller |

## Mixed-Mode Workflows

Common patterns combining multiple delegation tools:

### Pattern: Discover → Dispatch → Monitor

```
1. hivemind-command-engine discover → list available commands
2. execute-slash-command → execute the command with agent override
3. Command output → parse results
4. task tool → dispatch follow-up work (PREFERRED) OR delegate-task → (async background only)
5. delegation-status → poll for completion (delegate-task only)
```

### Pattern: Parallel Batch Dispatch

```
1. Define N independent tasks
2. For code/artifacts: task tool sequentially (PREFERRED, full control)
3. For research/audit ONLY: delegate-task in parallel with agent="specialist"
4. Record all delegation IDs (delegate-task only)
5. Continue own work while subagents run (delegate-task only)
6. delegation-status each ID → collect results when completed (delegate-task only)
```

### Pattern: Stack-On with Context Preservation

```
1. Locate session ID of completed session (session-tracker)
2. task tool with task_id → attach as child (PREFERRED, full control)
3. OR delegate-task with parentSessionId → (async background only)
4. New subagent inherits context from parent session
5. Prompt stays simple — do not re-describe old work
```

## Permission and Safety Considerations

| Concern | Mitigation |
|---------|------------|
| Agent has wrong tool permissions | Verify via `hivemind-sdk-supervisor readiness` or `configure-primitive read` before dispatching |
| Delegation depth exceeds 3 | Flatten hierarchy — dispatch directly rather than chaining through intermediates |
| Delegation budget unbounded | Set explicit turn/token limits in delegate-task config |
| Agent override without subtask flag | Defaults to subtask:false (synthetic parent prompt) — verify this is intended |
| Session ID leaked into prompt text | Never embed session IDs in prompt. Use `task_id` or `parentSessionId` parameters |
