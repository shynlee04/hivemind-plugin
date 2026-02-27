---
name: hivefiver-spec
description: Alias command for /hivefiver spec that runs strict specification
  distillation and ambiguity gates.
owner_agent: hivefiver
kind: alias
alias_resolved_to: hivefiver spec
required_skills: []
required_templates: []
chain_group: hivefiver
entry_gate: session_declared
---

# HiveFiver Spec Alias

Run `/hivefiver spec` behavior.

## Required Behavior
1. Trigger structured spec distillation.
2. Build ambiguity map.
3. Apply retry loop (max 10 attempts for high-impact unresolved ambiguity).
4. Escalate with targeted hints when attempts exceed thresholds (3, 6, 10).

## Output Contract
- `alias_resolved_to`: `/hivefiver spec`
- `next_command`: `/hivefiver-specforge`
