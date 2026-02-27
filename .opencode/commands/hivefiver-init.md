---
name: hivefiver-init
description: Alias command for /hivefiver init with backward-compatible
  onboarding and governance lock.
owner_agent: hivefiver
kind: alias
alias_resolved_to: hivefiver init
required_skills:
  - meta-builder-governance
  - hivefiver-persona-routing
  - hivefiver-spec-distillation
required_templates: []
chain_group: hivefiver
group: hivefiver
entry_gate: session_declared
---
# HiveFiver Init Alias

Run `/hivefiver init` behavior.

## Required Behavior
1. Start with project regulation pass.
2. Route persona lane (`vibecoder`, `floppy_engineer`, `enterprise_architect`).
3. Emit controlled multiple-choice onboarding.
4. Persist onboarding artifact and lane decisions.
5. Force handoff to `hiveminder` before any build-stage action.

## Output Contract
- `alias_resolved_to`: `/hivefiver init`
- `next_command`: `/hivefiver-start`
- `next_agent`: `hiveminder`
- `handoff_required`: `true`
- `handoff_reason`: `HiveFiver init is setup-only; runtime orchestration must continue in Hiveminder.`

## Rejection Conditions
- If handoff is not acknowledged, return blocked status and do not continue into build-stage actions.
