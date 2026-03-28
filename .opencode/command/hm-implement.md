---
description: "Execute an implementation workflow with workflow-aware context loading, bounded delegation, and verification-ready outputs."
agent: hivefiver
subtask: true
consumes_state:
  - workflow-plan
  - planning-projection
produces_state:
  - implementation-runtime
  - verification-evidence
verification_contract: implementation-traceability
closeout_gate: advisory
artifact_projections:
  - planning
---

# HM Implement

## Objective
Carry an implementation-class request through context loading, execution, and verification-prep without losing workflow continuity.

## Context
- Arguments: `$ARGUMENTS`
- Trigger: purpose class `implementation`
- Output focus: execution results plus verification-ready evidence

## Process
1. Load only the required runtime and planning context.
2. Execute the implementation tranche with bounded delegation rules.
3. Produce verification-ready outputs and continuity notes.
4. Route into the correct review or follow-up command.

## Output Contract
- execution_summary
- files_or_surfaces_changed
- evidence
- next_command
