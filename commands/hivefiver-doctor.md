---
name: "hivefiver-doctor"
description: "Audit HiveFiver v2 readiness across MCP, commands, skills, workflows, and .hivemind reality-vs-config alignment."
---

# HiveFiver Doctor

## Purpose
Run system-wide diagnostics and produce a deterministic remediation checklist.

## Required Diagnostics
1. Command/skill/workflow asset parity (`commands/` <-> `.opencode/`).
2. MCP readiness and credentials posture:
- Context7
- DeepWiki
- Repomix
- Tavily
- Exa
3. Auto-realignment rule health.
4. TODO/task schema conformance.
5. .hivemind state consistency.

## Remediation Rules
- emit actionable TODOs for missing providers
- include env var examples for credentials
- include confidence downgrade impact

## Required Checkpoint
```ts
map_context({ level: "action", content: "HiveFiver v2 diagnostics and remediation planning" })
save_mem({ shelf: "decisions", content: "Doctor audit completed", tags: ["hivefiver", "doctor", "v2"] })
```

## Output Contract
Return:
- `asset_parity_report`
- `mcp_readiness_table`
- `task_schema_report`
- `realignment_report`
- `remediation_checklist`
