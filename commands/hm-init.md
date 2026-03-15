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

## Mandatory Execution Rules
1. First inspect runtime state with `hivemind_runtime_status`.
2. Never hand-write `.hivemind/**` files with `bash`, `write`, or ad hoc JSON scaffolding.
3. To actually run bootstrap, you must call `hivemind_runtime_command` with `command: "hm-init"`.
4. If profile choices are missing, ask the user for them before running bootstrap:
   - preferred user name
   - chat language
   - artifact language
   - expertise level
   - governance mode
   - automation level
   - output style
5. If the user gives partial profile choices, pass the provided values to `hivemind_runtime_command` and let the runtime defaults fill the rest.

## Process
1. Inspect whether the control plane exists at all.
2. If required profile/governance choices are still unknown, stop and ask the user concise intake questions instead of guessing.
3. Execute `hivemind_runtime_command` for `hm-init` with any known bootstrap profile values.
4. Return the startup report and next workflow command instead of drifting directly into unrelated work.

## Output Contract
- status
- created_state
- missing_prerequisites
- next_command
