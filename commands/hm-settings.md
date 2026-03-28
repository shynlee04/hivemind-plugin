---
description: "Adjust control-plane settings without mutating unrelated workflow state."
agent: hivefiver
subtask: false
consumes_state:
  - entry
  - workflow-authority
produces_state:
  - runtime-profile
verification_contract: settings-delta
closeout_gate: required
artifact_projections:
  - recovery
---

# HM Settings

## Objective
Update profile, governance, or guardrail posture while preserving workflow continuity.

## Context
- Arguments: `$ARGUMENTS`
- Trigger: explicit settings or reconfiguration request
- Output focus: changed settings plus downstream effect summary

## Mandatory Execution Rules
1. First inspect runtime state with `hivemind_runtime_status`.
2. Never mutate settings through bash or direct file scaffolding.
3. To actually apply settings, you must call `hivemind_hm_setting` with the target `group` (e.g. `group: "language"`).
4. Start with the built-in `question` tool to ask which profile groups the user wants to change:
   - `language` (maps to legacy `identity-language`)
   - `expertise` (maps to legacy `expertise-style`)
   - `governance` (maps to legacy `governance-automation`)
   - `operation-mode`
5. Do not call `hivemind_hm_setting` with `group: "all"` when a mutation is intended — always specify the exact group.
6. For any selected group, collect explicit `key` and `value` arguments or offer "use recommended defaults" with `guided-onboarding`.

## Process
1. Determine which settings groups are being changed.
2. Use staged `question` prompts for only those groups.
3. Execute `hivemind_hm_setting` and include:
   - `group` matching the selected settings group
   - `key` and `value` for the specific setting to change (omit to read current values)
   - `intakeEvidence` with:
     - `source: "question-tool"`
     - `questionnaireId: "settings-profile-v1"`
     - `displayLanguage`
     - `completedGroups`
     - `usedRecommendedPresetGroups`
4. If the runtime returns `executionMode: "question-gate"`, continue the wizard rather than applying guessed values.
5. Summarize how the new settings affect routing, delegation, or verification posture.

## Output Contract
- updated_settings
- changed_fields
- impact_summary
- follow_up_needed
