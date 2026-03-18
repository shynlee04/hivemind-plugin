---
description: "Validate workflow readiness, continuity, and integration posture before high-control work proceeds."
agent: hivefiver
subtask: false
consumes_state:
  - workflow-authority
  - trajectory-ledger
  - task-ledger
produces_state:
  - readiness-verdict
  - recovery-checkpoint
  - planning-projection
verification_contract: harness-readiness
closeout_gate: advisory
artifact_projections:
  - planning
---

# HM Harness

## Objective
Confirm that the current runtime can safely execute planning, implementation, verification, or recovery workflows.

## Context
- Arguments: `$ARGUMENTS`
- Trigger: readiness validation for classes 3-8
- Output focus: workflow readiness and validated next-step routing

## Process
1. Evaluate workflow presence, handoff continuity, and runtime loading posture.
2. Confirm the required tool grants and command chain are available.
3. Report readiness, integration gaps, and any required repair or bootstrap steps.
4. Return the recommended command chain for the current purpose class.

## Output Contract
- readiness
- integration_gaps
- approved_workflow_chain
- next_command
