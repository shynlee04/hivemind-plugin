# Delegate with Context Workflow

How to delegate work to a subagent with the right context envelope. The
goal: the subagent has enough context to execute, but not so much that it
context-exhausts.

## Step 1: Choose the agent

Use `hm-coord-router` (the orchestrating focus skill) to pick the agent
based on the user's intent class. The agent is the execution target.

## Step 2: Compose the agent work contract

Use `templates/agent-work-contract-template.md`. The contract defines:
- `task_boundary`: what is the agent doing
- `allowed_surfaces`: which files the agent may touch
- `non_goals`: what is out of scope
- `required_proof`: what evidence the agent must return

## Step 3: Compose the delegation packet

Use `assets/skills/hm-coord-router/templates/delegation-packet-template.md`.
The packet has 5 required sections (task, scope, context, expected_output,
verification) + optional metadata.

## Step 4: Set max iterations

Default: 3 iterations. Max: 5. Set explicitly in the packet metadata:
`max_iterations: 3`.

## Step 5: Dispatch

Use the `task` tool with subagent_type and prompt. Store the returned
task_id (or delegation ID).

```
task({
  subagent_type: "<agent>",
  prompt: <packet-as-string>
})
```

## Step 6: Poll until done

```
delegation-status({ action: "list", status: "running" })
```

Or directly:
```
delegation-status({ delegationId: "<id>" })
```

Poll every 30 seconds. Stop on `DONE`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT`,
or `BLOCKED`.

## Step 7: Integrate or escalate

| Return | Action |
|---|---|
| `DONE` | Integrate the output. Write a resume pointer for the next session. |
| `DONE_WITH_CONCERNS` | Read the concerns. Decide: accept with note, or re-dispatch. |
| `NEEDS_CONTEXT` | Provide the missing context. Re-dispatch with augmented packet. |
| `BLOCKED` | Read the blocked reason. Escalate to user if 3 re-dispatches fail. |

## Step 8: Log the delegation

Append to `.hivemind/delegations/<delegation-id>/journal.md`:

```markdown
## <ISO timestamp> — <source-agent> → <target-agent>

**Intent:** <class>
**Packet hash:** <git hash of packet.yaml>
**Return:** <DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED>
**Iterations used:** <N>
**Concerns / blockers:** <list or "none">
```

## Stop conditions

- 3 re-dispatches with the same BLOCKED reason → escalate
- Context envelope > 50 lines → split into references + citation
- Agent file MISSING → do not dispatch; create the agent first
- Max iterations reached → escalate with full retry history
