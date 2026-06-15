# Route-and-Delegate Workflow

The 7-step sequence to dispatch a single-intent user prompt.

## Step 1: Read the user prompt

If `<10 words` and unambiguous, skip Step 2.

## Step 2: Walk the intent classification tree (if needed)

Load `references/intent-classification-tree.md` and walk top-down. Pick ONE
primary intent class.

## Step 3: Validate the intent

- Does the prompt contain a clear verb?
- Does only ONE class match?
- If NO or multi-class, escalate to user with the candidate classes.

## Step 4: Look up command + agent

Use `references/command-routing-table.md` and `references/agent-routing-table.md`.

Verify both files exist:

```bash
test -f assets/commands/<command>.md && test -f assets/agents/<agent>.md
```

If either is MISSING, escalate.

## Step 5: Compose the delegation packet

Use `templates/delegation-packet-template.md`. Fill all 5 required sections
+ optional metadata. Run schema validation:

```bash
yq -e '.task and .scope and .context and .expected_output and .verification' packet.yaml
```

## Step 6: Dispatch

```bash
delegate-task({
  agent: "<target_agent>",
  prompt: <packet_yaml_as_string>
})
```

Store the returned `delegationId` in a tracking list.

## Step 7: Poll and collect

```bash
delegation-status({ delegationId: "<id>" })
```

Poll every 30s. On `DONE`, collect the agent's output and integrate it. On
`BLOCKED`, escalate to user. On `NEEDS_CONTEXT`, provide the missing context
and re-dispatch.

## Stop conditions

- 3 consecutive gate failures on the same delegation → escalate
- Agent file MISSING → do NOT dispatch; create the agent first
- User prompt is multi-intent → split via `hm-coord-loop` instead
- Expected output references paths outside the scope → re-write the packet
