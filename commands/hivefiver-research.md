---
name: "hivefiver-research"
description: "Run iterative MCP research loops with mandatory provider checks, evidence grading, graceful degradation, and setup remediation."
---

# HiveFiver Research

## Purpose
Research dependencies, implementation patterns, and domain intelligence with explicit source confidence.

## Non-Negotiable MCP Stack
1. Context7
2. DeepWiki
3. Repomix
4. Tavily
5. Exa (provider-mode dependent)

## Provider Readiness Gate
Before research, emit `provider_status` for each provider:
- `ready`
- `misconfigured`
- `missing_credentials`
- `disabled`
- `unavailable_runtime`

If Tavily is not ready, include exact setup TODO:
- "Set `TAVILY_API_KEY` in environment and enable Tavily MCP entry"

## Research Loop (Iterative)
1. Build query matrix by lane (`dev`, `marketing`, `finance`, `office-ops`, `hybrid`).
2. Run provider batches in this order:
- DeepWiki + Repomix for repository/context grounding
- Context7 for official docs/API references
- Tavily/Exa for external corroboration
3. Build contradiction register.
4. Score evidence confidence.
5. Emit remediation TODOs for missing providers.

## Confidence Contract
- `full`: corroborated, no critical provider gaps.
- `partial`: useful but with provider or contradiction gaps.
- `low`: weak evidence, major missing providers, or unresolved conflicts.

Never fake `full` confidence.

## DeepWiki QA Translation Rules
For high-complexity content delivery, keep this behavior:
- Prefer transformed-context reminders over raw style changes.
- Track tasks/TODO updates explicitly during research loops.
- Preserve output structure even when adding extra context.

## Required Checkpoint
```ts
map_context({ level: "action", content: "MCP research loop with confidence grading" })
export_cycle({ outcome: "success", findings: "Research completed with confidence and setup TODOs" })
```

## Output Contract
- `provider_status_matrix`
- `evidence_table`
- `source_quality_matrix`
- `contradiction_register`
- `confidence_score`
- `mcp_gap_todos`
- `next_command`: `/hivefiver-skillforge`
