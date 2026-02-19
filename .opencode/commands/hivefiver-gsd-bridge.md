---
name: "hivefiver-gsd-bridge"
description: "Map HiveFiver outputs to GSD lifecycle checkpoints with deterministic lineage and phase-gate evidence."
---

# HiveFiver GSD Bridge

## Purpose
Provide compatibility wrapper output for GSD lifecycle usage without mirroring the full framework.

## Mapping Contract
Map HiveFiver sections into:
- `project`
- `milestone`
- `phase`
- `plan`
- `task`
- `verification`

## Validation Rules
Before export:
- every mapped task must have lineage parent(s),
- every phase must have verification gates,
- no orphan node in compatibility payload,
- confidence level from research must be present.

## Required Checkpoint
```ts
map_context({ level: "action", content: "GSD compatibility mapping and lineage validation" })
export_cycle({ outcome: "success", findings: "GSD compatibility mapping generated" })
```

## Output Contract
- `gsd_lifecycle_map`
- `phase_gate_table`
- `lineage_validation_report`
- `research_confidence_inheritance`
- `next_command`: `/hivefiver-ralph-bridge`
