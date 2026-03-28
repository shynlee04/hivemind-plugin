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

## Mandatory Execution Rules
1. First inspect runtime state with `hivemind_runtime_status`.
2. Never hand-write `.hivemind/**` files with `bash`, `write`, or ad hoc JSON scaffolding.
3. To run diagnostics, you must call `hivemind_hm_doctor` with `scope: "all"` (default) or a specific scope (`skills`, `agents`, `config`, `paths`).
4. Use `fix: true` only when the user explicitly requests repairs — the tool proposes fixes but requires authorization via `context.ask()`.
5. Do not bypass the tool by reading files manually and synthesizing a diagnosis — use the tool's structured findings.
6. Route into repair actions before allowing implementation or verification workflows.

## Process
1. Call `hivemind_hm_doctor` with `scope: "all"` to run full diagnostics.
2. Review the structured findings for blocking faults versus advisory issues.
3. If `fix: true` was requested, re-call with the same scope and `fix: true` to propose repairs.
4. Emit a concise diagnosis packet with the recovery command sequence.

## Output Contract
- health_status
- blockers
- repair_actions
- next_command
