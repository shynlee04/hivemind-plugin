---
description: "Scan the project codebase and build a HiveMind backbone. Run on first use or when switching projects."
agent: hiveminder
---

# HiveMind Project Scan

You are performing a HiveMind brownfield reconnaissance and stabilization scan.
Run this before any major refactor or when entering an unfamiliar project.

## Step 1: Inspect runtime readiness
Call the live runtime inspection tool:

```ts
hivemind_runtime_status({})
```

Extract and report:
- Runtime attachment state
- Active trajectory/workflow/task bindings
- Missing profile or bootstrap fields
- Available `hm-*` command surfaces

## Step 2: Analyze the repo directly
Read the actual project surfaces before recommending action:

- root `AGENTS.md`
- `README.md`
- top-level project structure
- any active planning artifacts such as `task_plan.md`, `findings.md`, and `progress.md`

Focus on:
- authority drift between docs and source
- runtime readiness gaps blocking `hm-*` workflows
- the safest next bounded slice

## Step 3: Bootstrap or repair only if needed
If the runtime status shows missing or unhealthy state, call the live runtime command tool:

```ts
hivemind_runtime_command({ command: "hm-init" })
// or
hivemind_runtime_command({ command: "hm-doctor" })
```

Then re-check readiness with `hivemind_runtime_status({})`.

## Step 4: Recommend the next bounded move
Do not invent legacy lifecycle calls. Recommend the smallest source-backed next step based on the current runtime and the files you actually read.

## Output Contract
Report in this order:
1. Runtime readiness and blockers
2. Authority or source-truth risks
3. Recovery action taken, if any
4. Next executable step
