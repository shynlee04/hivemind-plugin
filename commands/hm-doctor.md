---
description: "Audit and repair unhealthy control-plane state before workflow execution continues."
agent: hivefiver
subtask: false
consumes_state:
  - workflow-authority
  - trajectory-ledger
produces_state:
  - repair-actions
  - recovery-checkpoint
  - planning-projection
verification_contract: recovery-health
closeout_gate: required
artifact_projections:
  - planning
  - recovery
---

# HM Doctor

## Objective
Diagnose broken or stale Hivemind state, decide what blocks execution, and produce a repair-first recovery path.

## Context
- Arguments: `$ARGUMENTS`
- Trigger: unhealthy `.hivemind` state, continuity drift, or explicit repair intent
- Output focus: diagnosis, repair posture, and next-step command routing

## Process
1. Inspect the current control plane, session continuity, and readiness state.
2. Identify blocking faults versus advisory issues.
3. Route into repair actions before allowing implementation or verification workflows.
4. Emit a concise diagnosis packet with the recovery command sequence.

## Output Contract
- health_status
- blockers
- repair_actions
- next_command
