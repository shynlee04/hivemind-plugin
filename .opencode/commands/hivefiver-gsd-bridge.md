---
name: "hivefiver-gsd-bridge"
description: "Map HiveFiver v2 outputs to GSD lifecycle checkpoints with deterministic lineage and evidence-linked phase gates."
---

# HiveFiver GSD Bridge

## Purpose
Provide a compatibility wrapper into GSD lifecycle semantics without mirroring full framework internals.

## Mapping Rules
Map HiveFiver artifacts into:
- lifecycle node
- phase goal
- evidence status
- lineage status

## Gate Rules
- block progression when lineage breaks
- preserve confidence inheritance from research
- attach remediation actions for broken gates

## Output Contract
Return:
- `gsd_phase_map`
- `lineage_snapshot`
- `phase_gate_matrix`
- `remediation_actions`
- `next_command`: `/hivefiver validate`
