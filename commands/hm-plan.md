---
description: "Convert the current request into a structured plan with routed workflow stages, constraints, and next execution steps."
agent: hivefiver
subtask: true
---

# HM Plan

## Objective
Produce a structured plan that respects lineage, workflow continuity, and the current control-plane state.

## Context
- Arguments: `$ARGUMENTS`
- Trigger: purpose class `planning`
- Output focus: plan structure plus executable next command routing

## Process
1. Distill the request into the smallest decision-bearing planning units.
2. Route each unit into the correct workflow stage.
3. Attach the required tool grants, knowledge surfaces, and risk gates.
4. Return the resulting plan and the next execution-ready command.

## Output Contract
- plan_summary
- workflow_stages
- risk_gates
- next_command
