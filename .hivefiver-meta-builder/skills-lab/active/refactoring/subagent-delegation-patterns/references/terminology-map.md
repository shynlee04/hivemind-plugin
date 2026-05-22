# Delegation Terminology Map — Cross-Framework Concepts

## Purpose

Different frameworks and projects use different words for delegation mechanics.
This map translates between them so agents can recognize delegation patterns
regardless of which framework originated the concept.

## Delegation Concept Translation

| Concept | OpenCode Native | Agent Ecosystem | General Meaning |
|---------|-----------------|-----------------|-----------------|
| **Dispatch** | delegate-task, task tool | spawn, launch, create, fork | Sending work to a subagent session |
| **WaiterModel** | delegate-task (always-background) | async dispatch, fire-and-forget | Dispatch returns immediately; caller polls for completion |
| **Blocking dispatch** | task tool (implicit wait) | synchronous dispatch, await | Caller waits for subagent to complete before continuing |
| **Subagent** | subagent_type parameter | worker, specialist, child agent, delegate | The agent type launched to perform the work |
| **Prompt** | prompt parameter | task description, instructions, context | Bounded description of what to do, why, and scope |
| **Parent session** | parentSessionId | orchestrator session, caller, root | The session that dispatched the subagent |
| **Stacking** | context: {"parentSessionId":"..."} | attach-to-session, chain delegation | Creating a child delegation linked to an existing parent |
| **Completion detection** | delegation-status tool | polling, progress check, status query | Checking whether a dispatched subagent has finished |
| **Dual-signal** | status + lastMessage | output + completion signal | WaiterModel returns both final status and agent output |
| **Synthetic injection** | subtask:false + agent | one-shot override, inline dispatch | Agent prompt injected as synthetic utterance, not user input |
| **Command dispatch** | execute-slash-command | slash command, routed execution, proxy | Expanding and running a registered slash command |

## Tool → Dispatch Model Mapping

| Tool | Dispatch Model | Completion Model | Stacking Support |
|------|---------------|------------------|------------------|
| `task` tool | Synchronous (blocking) | Automatic (runtime-managed) | `task_id` parameter |
| `delegate-task` | WaiterModel (always-background) | Polling via `delegation-status` | `parentSessionId` in context JSON |
| `execute-slash-command` | One-shot (immediate return) | Return value + agent output | N/A — one-shot |
| `delegation-status` | N/A (read-only) | Poll-based query | N/A |
| `hivemind-session-view` | N/A (read-only) | Unified cross-root query | N/A |

## Key Distinctions

### Task tool vs Delegate-task

| | task tool | delegate-task |
|---|----------|---------------|
| Returns when | Subagent completes | Immediately (delegation ID) |
| Progress tracking | None (automatic) | Manual polling required |
| Best for | Simple bounded tasks | Complex async work |
| Stacking | `task_id` parameter | `parentSessionId` in context JSON |

### Delegate-task vs Execute-slash-command

| | delegate-task | execute-slash-command |
|---|-------------|----------------------|
| Target | Any registered agent | Commands (optionally with agent override) |
| Duration | Multi-turn | One turn |
| Output | Pollable via delegation-status | Immediate return |

### Session Stacking vs Fresh Dispatch

| | Stacking (parentSessionId) | Fresh Dispatch |
|---|---------------------------|----------------|
| Hierarchy | Child of existing session | New root session |
| Context | Inherits parent context chain | Fresh context (prompt only) |
| When to use | Related work, continuation | Completely independent work |
