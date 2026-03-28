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
3. To actually run bootstrap, you must call `hivemind_hm_init` with `mode: "auto"` (or `"greenfield"` / `"brownfield"` when explicitly directed).
4. If `profileComplete` is false, you must immediately use the built-in `question` tool wizard before attempting bootstrap.
5. Do not ask a free-text permission question like "do you want me to run hm-init?" when bootstrap is already required.
6. Do not let runtime defaults silently fill missing profile groups. Missing intake must be completed explicitly or via the recommended preset groups.

## Process
1. Inspect whether the control plane exists at all.
2. If the bootstrap profile is incomplete, run a staged `question` wizard:
   - Stage 1: `preferredUserName`, `chatLanguage`, `artifactLanguage`
   - Stage 2: `expertiseLevel`, `outputStyle`
   - Stage 3: `governanceMode`, `automationLevel`
3. For Stages 2 and 3, offer "use recommended defaults" as the `guided-onboarding` preset.
4. After all stages are complete, execute `hivemind_hm_init` with `mode: "auto"` and include:
   - `force: true` only when a full re-bootstrap is explicitly requested
   - `intakeEvidence` with:
     - `source: "question-tool"`
     - `questionnaireId: "bootstrap-profile-v1"`
     - `displayLanguage`
     - `completedGroups: ["identity-language", "expertise-style", "governance-automation"]`
     - `usedRecommendedPresetGroups` for any stage that used the preset
5. If the runtime returns `executionMode: "question-gate"`, continue the wizard instead of improvising with defaults or shell writes.
6. Return the startup report and next workflow command instead of drifting directly into unrelated work.

## Output Contract
- status
- created_state
- missing_prerequisites
- next_command
