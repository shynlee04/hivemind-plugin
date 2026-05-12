# Reference 02: Task Tool Resume

## The Golden Rule

```
task_id IS session_id. When you resume with task_id, the agent continues from where it left off.
Context is preserved. Do NOT repeat the prompt.
```

## The "No Thought Must" Principle (from SKILL.md Section 2)

**This is the most important thing to internalize about session resume:**

```
WHEN you see an aborted/active session ID:
  → task({subagent_type: <same>, task_id: <exact ID>, prompt: "Continue"})
  → NO reasoning about whether it's the right session
  → NO checking if context was preserved (it IS — automatically)
  → NO asking "but what if it completed?" (it returns safely if wrong)
  → JUST DELEGATE
```

**Why this works:** Even if you resume the wrong session, the subagent gets the restored context, processes it, and returns with "I don't recognize this" or equivalent. No harm. No data loss. The session-tracker saved everything. You can always start fresh if wrong.

**Repeat:** THERE IS NO RISK IN RESUMING THE WRONG SESSION. The safety is in the tool itself — wrong sessions return safely, right sessions continue perfectly.

## OpenCode Task Tool Parameters

The `task` tool dispatches subagents. When resuming, use:

```json
{
  "description": "resume",
  "subagent_type": "<SAME agent type as original dispatch>",
  "task_id": "<EXACT session ID of aborted child>"
}
```

### Parameter details:

| Parameter | Required | Value |
|-----------|----------|-------|
| `description` | Yes | `"resume"` (or brief 3-5 word description) |
| `subagent_type` | Yes | **EXACT SAME** agent type from `delegatedBy` field in session-continuity.json |
| `task_id` | Yes | The child's session ID (24-char hex) |
| `prompt` | **OMIT or MINIMAL** | Do NOT repeat the original prompt — context is preserved |

### Why prompt is omitted/minimal:

When you resume with `task_id`, OpenCode restores the subagent's entire conversation state — including the original prompt, all turns, all tool calls. Repeating the prompt would:
1. Waste context budget (the agent already has it)
2. Cause the agent to restart work instead of continuing
3. Confuse the agent about whether this is new or resumed

### Minimal prompt (if required):

If the platform demands a non-empty prompt string:
```
"Resume session."
```

Never include more than that.

## Finding the Correct agent_type

The `delegatedBy` field in session-continuity.json records the original agent type:

```json
{
  "ses_1ebe39941ffecHehSRcc13IqeD": {
    "file": "ses_1ebe39941ffecHehSRcc13IqeD.json",
    "depth": 1,
    "status": "active",
    "delegatedBy": "hm-l2-auditor",
    "children": {}
  }
}
```

→ Use `"hm-l2-auditor"` as the `subagent_type` for resume.

## How Session-Tracker Captures task_id

When a task is dispatched, the session-tracker hook (`tool.execute.after`) captures:
- `tool`: `"task"`
- `sessionID`: the child session ID → stored as task_id
- `args.subagent_type`: the agent type → stored as delegatedBy
- `args.description`: task description

The child session ID appears in the parent's `.md` file under:
```
## TOOL: task(tool_id=N, description="...", subagent_type="<type>")
```

And in the session-continuity.json under `hierarchy.children.<childSessionId>`.

## Worked Resume Example

### Original dispatch (recorded in session-continuity.json):
```json
{
  "ses_1ebe39941ffecHehSRcc13IqeD": {
    "depth": 1,
    "status": "active",
    "delegatedBy": "hm-l2-auditor",
    "children": {}
  }
}
```

### Resume invocation:
```
task(
  description="resume",
  subagent_type="hm-l2-auditor",
  task_id="ses_1ebe39941ffecHehSRcc13IqeD"
)
```

### What happens:
1. OpenCode looks up `ses_1ebe39941ffecHehSRcc13IqeD` in its session store
2. Restores the hm-l2-auditor subagent with all prior conversation state
3. The agent sees its last turn and continues from there
4. The agent has access to all files it previously read
5. The agent knows what it was doing and what's pending

### If you resume the wrong session (safety guarantee):
1. OpenCode restores the wrong session's context
2. The subagent says "I don't recognize this task" or returns immediately
3. **No harm. No wasted work.** Start a fresh task with a new ID.
4. The SKILL.md is explicit: "even if wrong it returns safely"

**This guarantee is what makes the "no thought must" pattern work.** You don't need to worry about choosing wrong. The system handles wrong choices safely.

## L0→L1 Cascade Resume

When L0 resumes an L1 coordinator, the coordinator must:

```
1. On spawn, L1 coordinator checks its OWN session-continuity.json:
   read(".hivemind/session-tracker/<l1_session_id>/session-continuity.json")

2. Finds active L2 children:
   hierarchy.children.<childId>.status === "active"

3. Resumes each active child with EXACT task_id:
   task(description="resume", subagent_type="<delegatedBy>", task_id="<childId>")

4. NEVER creates new child sessions when aborted ones exist
```

## Common Mistakes

| Mistake | Why Wrong | Correct |
|---------|-----------|---------|
| `task(description="audit session tracker", prompt="<repeated prompt>", ...)` | Prompt repeated — context wasted, agent restarts | `task(description="resume", task_id="<id>")` |
| `task(description="resume", subagent_type="hm-l2-researcher", task_id="<id>")` | Wrong agent type — delegatedBy said "hm-l2-auditor" | Use EXACT `delegatedBy` value |
| `task(description="new", subagent_type="hm-l2-auditor", task_id=<new-id>)` | New session created instead of resume | Use EXISTING child session ID |
| `task(description="resume", task_id="<id>")` without subagent_type | Missing agent type | Include `subagent_type` from `delegatedBy` |
