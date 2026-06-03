# Template: Agent Frontmatter

> **Loading trigger:** When creating a new agent.

## YAML Skeleton

```yaml
---
name: agent-name
description: "Specialist agent for [specific domain]"
mode: "all"  # or "subagent"
hidden: false  # true to hide from user Tab selection
temperature: 0.2  # lower for deterministic, higher for creative
permission:
  bash: "ask"
  edit: "ask"
  read: "allow"
  glob: "allow"
  grep: "allow"
  task: "allow"  # or deny for leaf agents
---
```

## Permission Model
- `allow` — agent can use without asking
- `ask` — agent must get user approval
- `deny` — agent cannot use this tool
- Wildcards: `"mymcp_*": "ask"` for all tools from an MCP server

## Delegation Config
- `mode: "all"` — can delegate to further downstream agents
- `mode: "subagent"` — narrow scope, fewer tools
- `hidden: true` — not shown in user Tab selection
