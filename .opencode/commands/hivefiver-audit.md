---
name: hivefiver-audit
description: Alias command for /hivefiver audit that runs system-wide health
  checks and alignment diagnostics.
owner_agent: hivefiver
kind: alias
alias_resolved_to: hivefiver audit
required_skills: []
required_templates: []
chain_group: hivefiver
entry_gate: session_declared
---

# HiveFiver Audit Alias

Run `/hivefiver audit` behavior.

## Required Behavior
1. Check commands/skills/workflows drift.
2. Check MCP readiness matrix.
3. Check .hivemind reality vs expected state.
4. Output prioritized remediation plan.

## Output Contract
- `alias_resolved_to`: `/hivefiver audit`
- `next_command`: `/hivefiver-doctor`
