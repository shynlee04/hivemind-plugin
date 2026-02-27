---
name: hivefiver-architect
description: Alias command for /hivefiver architect to design agent/subagent
  topology and deterministic delegation policy.
owner_agent: hivefiver
kind: alias
alias_resolved_to: hivefiver architect
required_skills:
  - meta-builder-governance
  - hivefiver-persona-routing
  - hivefiver-spec-distillation
required_templates: []
chain_group: hivefiver
group: hivefiver
entry_gate: session_declared
---
# HiveFiver Architect Alias

Run `/hivefiver architect` behavior.

## Required Behavior
1. Define lane-specific agent topology.
2. Select deterministic workflow policy and gates.
3. Attach required skills and fallback skills.
4. Emit architecture artifact for reuse.

## Output Contract
- `alias_resolved_to`: `/hivefiver architect`
- `next_command`: `/hivefiver-skillforge`
