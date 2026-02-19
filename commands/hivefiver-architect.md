---
name: "hivefiver-architect"
description: "Alias command for /hivefiver architect to design agent/subagent topology and deterministic delegation policy."
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
