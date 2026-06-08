# Dispatch Workflow

The 7-step sequence for dispatching a multi-agent workflow.

## Step 1: Count the tasks

If 1 task → do inline. Don't load this skill.

## Step 2: Classify the work

Use the decision matrix in `references/dispatch-patterns.md`:
- Parallel: no shared state, no ordering
- Wave: dependency layers
- Pipeline: strict linear chain
- Assess first: if unclear, map dependencies

## Step 3: Bound the iterations

Declare max iteration budget before first dispatch:
- Default: 5
- Hard cap: 5 (per `hm-gate-triad`)
- Loops that exceed MUST escalate

## Step 4: Define completion criterion

Write literal condition: "Loop exits when: `_____`."
If you can't fill the blank, the loop is unbounded — refuse to dispatch.

## Step 5: Compose task envelopes

For each task, use `templates/task-envelope.md`. 5 required sections:
1. task (one sentence)
2. scope (include/exclude paths)
3. context (≤50 lines)
4. expected_output (deliverables + acceptance criteria)
5. verification (command + expected exit)

## Step 6: Dispatch

```bash
# Use the Hivemind delegate-task tool
delegate-task({
  agent: "<target-agent>",
  prompt: <envelope-as-yaml-string>
})
```

Store delegation ID. Dispatch ALL parallel tasks in one turn (don't sequentialize).

## Step 7: Poll + collect

```bash
delegation-status({ delegationId: "<id>" })
```

Poll every 30s. On `DONE`, integrate. On `BLOCKED`, escalate. On `NEEDS_CONTEXT`, augment envelope and re-dispatch.

## Max-Iteration Enforcement

Track per workflow. At iteration 3: warn. At iteration 5: HARD STOP with summary.

## Stop Conditions
- Same error across 3 different agents → escalate
- Tool/permission issue → escalate
- Merge conflict in shared file → escalate
- Agent times out without output → escalate
- Dependency graph has cycle → escalate
