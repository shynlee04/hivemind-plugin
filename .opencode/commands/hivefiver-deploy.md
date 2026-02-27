---
name: hivefiver-deploy
description: Alias command for /hivefiver deploy that validates environment
  readiness and deployment governance controls.
owner_agent: hivefiver
kind: alias
alias_resolved_to: hivefiver deploy
required_skills:
  - meta-builder-governance
  - hivefiver-persona-routing
  - hivefiver-spec-distillation
required_templates: []
chain_group: hivefiver
group: hivefiver
entry_gate: session_declared
---
# HiveFiver Deploy Alias

Run `/hivefiver deploy` behavior.

## Required Behavior
1. Audit environment and secrets posture.
2. Validate release gate dependencies.
3. Emit deployment checklist and rollback prerequisites.

## Output Contract
- `alias_resolved_to`: `/hivefiver deploy`
- `next_command`: `/hivefiver-doctor`
