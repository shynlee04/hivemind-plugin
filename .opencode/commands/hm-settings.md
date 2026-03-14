---
description: "Adjust control-plane settings without mutating unrelated workflow state."
agent: hivefiver
subtask: false
---

# HM Settings

## Objective
Update profile, governance, or guardrail posture while preserving workflow continuity.

## Context
- Arguments: `$ARGUMENTS`
- Trigger: explicit settings or reconfiguration request
- Output focus: changed settings plus downstream effect summary

## Process
1. Determine which settings surfaces are being changed.
2. Apply only the requested configuration deltas.
3. Summarize how the new settings affect routing, delegation, or verification posture.

## Output Contract
- updated_settings
- impact_summary
- follow_up_needed
