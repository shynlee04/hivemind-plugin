# Session Stacking Protocol

Detailed protocol for attaching new work as a child of an existing session using `task_id` (task tool) or `parentSessionId` (delegate-task).

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Stacking via task_id (Task Tool)](#stacking-via-task_id-task-tool)
3. [Stacking via parentSessionId (Delegate-Task)](#stacking-via-parentsessionid-delegate-task)
4. [Verification Before Stacking](#verification-before-stacking)
5. [Anti-Patterns and Recovery](#anti-patterns-and-recovery)

## Core Concepts

Session stacking means attaching new work as a child of an existing session — preserving the delegation hierarchy chain. This covers two distinct scenarios:

- **Resume:** Continuing an incomplete session where the previous agent left off
- **Stack on:** Adding new work as a child of a completed session to inherit its context

Both scenarios use the same mechanism: passing the existing session ID as a parameter. The key difference is intent — resuming continues work; stacking adds new work.

## Stacking via task_id (Task Tool)

Use the `task` tool's `task_id` parameter to resume an existing subagent session.

**Step-by-step:**

1. Retrieve the session ID you want to attach to (from a previous delegation or session-tracker query)
2. Call the `task` tool with:
   - `subagent_type`: The agent type to use
   - `prompt`: The task description
   - `task_id`: The existing session ID you want to resume
3. The tool creates a new subagent session attached as a child of the target session
4. The new subagent inherits the context chain from the parent

**Example:**
```
task(
  subagent_type: "general",
  prompt: "Continue the audit from where it left off...",
  task_id: "ses_abc123"  // existing session to resume
)
```

**Important:** The `task_id` parameter supports BOTH resuming an incomplete session AND stacking new work onto a completed session. This aligns with the skill's stance that both `task` (with `task_id`) and `delegate-task` (with `parentSessionId`) can attach work to existing sessions. The `task` tool is the **preferred approach** for code editing and artifact work; `delegate-task` with `parentSessionId` is the async alternative for research/audit/review tasks. Do NOT inject the session ID into the prompt text in either case — always pass it as a parameter.

## Stacking via parentSessionId (Delegate-Task)

Use the `delegate-task` tool's context parameter to attach new work as a child of any existing session.

**Step-by-step:**

1. Retrieve the session ID you want to attach to
2. Call `delegate-task` with:
   - `agent`: The target agent name
   - `prompt`: The task description
   - `context`: JSON string: `{"parentSessionId": "<session-id>"}`
3. The subagent runs asynchronously in a child session of the target
4. Poll for completion via `delegation-status`

**Example:**
```
delegate-task(
  agent: "researcher",
  prompt: "Analyze the findings from the completed audit...",
  context: '{"parentSessionId": "ses_xyz789"}'
)
```

**Critical rule:** Do NOT inject the session ID into the prompt text. This creates a new independent session instead of attaching to the target. The `context` parameter is the only correct mechanism.

## Verification Before Stacking

Before attaching work to a session, verify the session exists and is in a usable state:

**Using `session-tracker`:**
```
Check if the session exists and is active
session-tracker action: "get-status" sessionId: "<session-id>"
```

**Using `hivemind-session-view`:**
```
Get unified view including hierarchy
hivemind-session-view action: "get" sessionId: "<session-id>"
```

**Using `session-hierarchy`:**
```
Check delegation depth before stacking
session-hierarchy action: "get-delegation-depth" sessionId: "<session-id>"
```

**Red flags before stacking:**
- Session depth > 3 (risk of hierarchy bloat — consider flattening)
- Session marked as expired or purged
- Session belongs to a different workflow domain
- Session is actively running (conflict risk — wait or use a different session)

## Anti-Patterns and Recovery

| Anti-Pattern | Detection | Recovery |
|-------------|-----------|----------|
| **Session ID in prompt text** | `prompt: "Use session ses_abc123 to..."` | Move session ID to `task_id` or `context` parameter |
| **Stacking on expired session** | Stacked delegation never starts or errors immediately | Verify session via `session-tracker` before stacking. Use a fresh session. |
| **Deep nesting (depth > 3)** | Session hierarchy has 4+ levels of children | Flatten: dispatch directly to the target agent without intermediate sessions |
| **Stacking on running session** | Two subagents compete for the same parent | Wait for running session to complete, or dispatch to a different parent |
| **Lost context on stacked session** | New subagent does not have expected context | Use `session-journal-export` to extract context from parent, then include bounded summary in new prompt |
| **Prompt duplication** | Re-describing old work already in parent session | Prompt stays simple — parent session context is inherited through the chain |
