---
name: hivefiver-validate
description: Alias command for /hivefiver validate to run quality gates, schema
  checks, and export readiness controls.
owner_agent: hivefiver
kind: alias
alias_resolved_to: hivefiver validate
required_skills:
  - meta-builder-governance
  - hivefiver-persona-routing
  - hivefiver-spec-distillation
required_templates: []
chain_group: hivefiver
group: hivefiver
entry_gate: session_declared
---
# HiveFiver Validate Alias

Run `/hivefiver validate` behavior.

## Required Behavior
1. Run schema checks.
2. Verify TODO/story lineage.
3. Verify confidence labeling.
4. Emit remediation checklist for any failing gate.

## Output Contract
- `alias_resolved_to`: `/hivefiver validate`
- `next_command`: `/hivefiver-ralph-bridge`
