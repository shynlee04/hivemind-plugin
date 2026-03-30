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
2. To show the 40/60 dashboard overview (runtime mirror + settings guidance), call `hivemind_hm_setting` with `dashboard: true`. Pass `--dashboard` as the arguments string when invoking via the command handler.
3. Never mutate settings through bash or direct file scaffolding.
4. To actually apply settings, you must call `hivemind_hm_setting` with the target `group` (e.g. `group: "language"`).
5. Start with the built-in `question` tool to ask which profile groups the user wants to change:
   - `language` (maps to legacy `identity-language`)
   - `expertise` (maps to legacy `expertise-style`)
   - `governance` (maps to legacy `governance-automation`)
   - `operation-mode`
6. Do not call `hivemind_hm_setting` with `group: "all"` when a mutation is intended — always specify the exact group.
7. For any selected group, collect explicit `key` and `value` arguments or offer "use recommended defaults" with `guided-onboarding`.

## Dashboard Flow (when `--dashboard` is passed)

When the arguments contain `--dashboard`, follow this interactive sequence:

### Step 1: Inspect runtime
Call `hivemind_runtime_status` to confirm the runtime is attached and healthy.

### Step 2: Get dashboard data
Call `hivemind_hm_setting` with `dashboard: true`. This returns the 40/60 dashboard payload with pane40 (runtime mirror) and pane60 (settings guidance).

### Step 3: Present the dashboard
Show the user the dashboard data in a clear format:
- **Pane 40 (Runtime Mirror):** sessionId, runtimeAuthority, attachmentMode, workflowId, trajectoryId, gateSummary, healthSummary
- **Pane 60 (Settings):** group, nextAction, currentSettings, guidance

### Step 4: Ask rendering mode
Ask the user: **"How would you like to view the dashboard?"**
- **Option A: TUI** — Show the rendered TUI output inline (from `dashboard.rendered`)
- **Option B: Browser** — Generate a link to the side-car dashboard

If the user chooses **Browser**:
1. Take the dashboard spec (pane40/pane60 data) and encode it as base64 JSON
2. Generate the URL: `http://localhost:3001/?spec=<base64-encoded-spec>`
3. Present the URL to the user: "Open this in your browser: http://localhost:3001/?spec=..."
4. Explain what they'll see: a 2-pane dashboard with runtime mirror on the left and settings on the right

If the user chooses **TUI**:
1. Present the `dashboard.rendered` string directly in the conversation
2. Show the full dashboard data inline

### Step 5: Interactive configuration
After viewing the dashboard, ask the user if they want to change any settings:
- List the current settings from pane60
- Ask which group they want to modify
- Use `hivemind_hm_setting` with the target group and key/value to propose changes
- Require explicit authorization before applying any changes

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
