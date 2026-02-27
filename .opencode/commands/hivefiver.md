---
name: hivefiver
description: HiveFiver v2 meta-builder root command. Route /hivefiver <action>
  to deterministic workflows with adaptive tutoring and governance gates.
owner_agent: hivefiver
kind: utility
alias_resolved_to: hivefiver
required_skills:
  - meta-builder-governance
  - hivefiver-persona-routing
  - hivefiver-spec-distillation
required_templates: []
chain_group: hivefiver
group: hivefiver
entry_gate: session_declared
argument-hint: <action> [args]
---
# HiveFiver Root Command

HiveFiver is setup/meta-builder only. It must not remain the active build-stage executor.

Use this command as the canonical entry point:
- `/hivefiver init`
- `/hivefiver spec`
- `/hivefiver architect`
- `/hivefiver workflow`
- `/hivefiver build`
- `/hivefiver validate`
- `/hivefiver deploy`
- `/hivefiver research`
- `/hivefiver audit`
- `/hivefiver tutor`

## Action Router
1. Parse `$1` as action. If missing, default to `init`.
2. If action is unknown, route to `/hivefiver init` and emit remediation choices.
3. Keep legacy compatibility by recognizing old commands and aliases.
4. Enforce handoff policy:
   - `init` must emit `next_agent: hiveminder` and `handoff_required: true`.
   - `build|validate|deploy` must route with `handoff_required: true` and must not execute while HiveFiver remains active.

## Routing Matrix
- `init` -> `/hivefiver-start` + `/hivefiver-intake`
  Pre-gate: Detect persona lane, check onboarding status
- `spec` -> `/hivefiver-specforge`
  Pre-gate: Verify domain context loaded, check prior spec artifacts
- `architect` -> `/hivefiver-skillforge`
  Pre-gate: Require spec completion, check tooling alignment
- `workflow` -> `/hivefiver-skillforge` + workflow selector
  Pre-gate: Verify available workflows, check persona lane compatibility
- `build` -> `/hivefiver-gsd-bridge`
  Pre-gate: Verify plan graph connectivity, enforce TDD posture, check tooling compatibility, block if unresolved high-risk ambiguity
- `validate` -> `/hivefiver-ralph-bridge`
  Pre-gate: Confirm build output exists, check test coverage baseline
- `deploy` -> `/hivefiver-doctor` (environment readiness mode)
  Pre-gate: Audit environment/secrets posture, validate release gates, emit deployment checklist and rollback prereqs
- `research` -> `/hivefiver-research`
- `audit` -> `/hivefiver-doctor`
  Pre-gate: Check commands/skills/workflows drift, MCP readiness matrix, .hivemind reality vs expected state
- `tutor` -> `/hivefiver-tutor`

## Chat-First Tab Contract
Return outputs in this fixed structure:
1. `[📋 Spec]`
2. `[🔧 Build]`
3. `[🧪 Validate]`
4. `[🚀 Deploy]`
5. `[📚 Tutor]`

Each tab must include:
- progress meter (`[███░░░░░░]` style)
- current gate status
- next action options (multiple choice)

## Governance Rules
- No execution without context gate + evidence gate.
- No confidence above `partial` when MCP stack has unresolved gaps.
- Process guarantee only after all gates pass.
- Reject/stop if handoff-required flows are acknowledged as skipped.

## Output Contract
Return:
- `resolved_action`
- `resolved_command`
- `resolved_workflow`
- `persona_lane`
- `domain_lane`
- `progress_state`
- `next_step_options`
- `next_agent`
- `handoff_required`
- `handoff_reason`
