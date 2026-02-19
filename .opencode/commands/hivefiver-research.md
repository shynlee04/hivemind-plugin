---
name: "hivefiver-research"
description: "Run iterative MCP research loops with non-negotiable provider checks, confidence grading, and setup remediation."
---

# HiveFiver Research

## Non-Negotiable MCP Stack
1. Context7
2. DeepWiki
3. Repomix
4. Tavily
5. Exa (MCP or provider-native)

## Core Flow
1. Provider readiness scan.
2. Query matrix creation by domain lane.
3. Evidence collection order:
- DeepWiki + Repomix
- Context7
- Tavily + Exa corroboration
4. Contradiction register.
5. Confidence grading (`full`, `partial`, `low`).
6. Setup TODO emission for missing providers.

## Tavily Setup Rule
If Tavily is missing, include:
- `Set TAVILY_API_KEY in environment`
- `Enable Tavily MCP entry in opencode config`

## 10-Attempt Validation Loop
For unresolved contradictions:
- run up to 10 reconciliation attempts
- escalate with explicit caveats after 10

## DeepWiki QA Translation Rules
- transformed context can guide retrieval loops
- track TODO/task updates explicitly during research
- keep UI output structure stable while improving control

## Required Checkpoint
```ts
map_context({ level: "action", content: "MCP research loop with confidence grading" })
export_cycle({ outcome: "success", findings: "Research completed with confidence and setup TODOs" })
```

## Output Contract
Return:
- `source_quality_matrix`
- `evidence_table`
- `contradiction_register`
- `confidence`: `full` | `partial` | `low`
- `validation_attempt`
- `max_attempts`: 10
- `mcp_gap_todos`
- `next_command`: `/hivefiver architect`
