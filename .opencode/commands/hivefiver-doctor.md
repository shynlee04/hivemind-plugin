---
name: "hivefiver-doctor"
description: "Audit HiveFiver readiness across MCP, skills, commands, workflows, and .hivemind reality-vs-config alignment."
---

# HiveFiver Doctor

## Purpose
Diagnose setup issues and produce actionable remediation plans with severity.

## Audit Surface
1. Config health (`opencode.json` and template compatibility)
2. MCP readiness + credentials posture:
- Context7
- DeepWiki
- Repomix
- Tavily (API key guidance)
- Exa mode note
3. Skill coverage, freshness, and overlap
4. Command source consistency (`commands/` vs `.opencode/commands/`)
5. Workflow validity (`workflows/*.yaml` guard schema)
6. `.hivemind` state vs workspace reality (graph lineage, active tasks, stale mappings)

## Severity Model
- `critical`: blocks process guarantees
- `warning`: degraded but operable
- `info`: optimization opportunity

## Remediation Style
- Always provide explicit next actions.
- For missing credentials, provide env var examples.
- For command/skill drift, provide sync fix path.

## Required Checkpoint
```ts
map_context({ level: "action", content: "HiveFiver diagnostics and remediation planning" })
save_mem({ shelf: "decisions", content: "Doctor audit completed", tags: ["hivefiver", "doctor", "audit"] })
```

## Output Contract
- `health_score`
- `findings_by_severity`
- `mcp_readiness_table`
- `hivemind_alignment_report`
- `remediation_plan`
- `confidence_level`
