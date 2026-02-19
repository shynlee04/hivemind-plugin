---
name: "hivefiver-audit"
description: "Alias command for /hivefiver audit that runs system-wide health checks and alignment diagnostics."
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
