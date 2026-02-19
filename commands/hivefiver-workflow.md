---
name: "hivefiver-workflow"
description: "Alias command for /hivefiver workflow to produce lane-specific orchestration flows and guardrails."
---

# HiveFiver Workflow Alias

Run `/hivefiver workflow` behavior.

## Required Behavior
1. Select workflow lane.
2. Validate guard set (`context_first`, `evidence_gate`, `graph_connected`, `export_cycle`).
3. Emit workflow plan with dependencies.

## Output Contract
- `alias_resolved_to`: `/hivefiver workflow`
- `next_command`: `/hivefiver-gsd-bridge`
