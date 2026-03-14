---
description: "Bootstrap the Hivemind control plane and collect the minimum required profile, governance, and readiness state."
agent: hivefiver
subtask: false
consumes_state:
  - entry
produces_state:
  - workflow-authority
  - trajectory-ledger
  - recovery-checkpoint
  - planning-projection
verification_contract: bootstrap-readiness
closeout_gate: required
artifact_projections:
  - planning
  - recovery
---

# HM Init

## Objective
Establish the control plane when `.hivemind` is missing or incomplete, then hand back a valid starting state for later workflows.

## Context
- Arguments: `$ARGUMENTS`
- Trigger: missing control-plane state or an explicit bootstrap request
- Output focus: a startup report plus the next recommended command

## Process
1. Inspect whether the control plane exists at all.
2. Gather profile, governance, guardrail, and readiness intent.
3. Materialize the minimum valid startup state.
4. Return the next workflow command instead of drifting directly into unrelated work.

## Output Contract
- status
- created_state
- missing_prerequisites
- next_command
