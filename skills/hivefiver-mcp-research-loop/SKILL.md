---
name: hivefiver-mcp-research-loop
description: Run iterative MCP-backed research with provider readiness checks, confidence scoring, contradiction control, and graceful fallback.
---

# HiveFiver MCP Research Loop

Use this skill when HiveFiver needs evidence-backed research for planning, architecture, delivery, or domain decisions.

## Workflow
1. Run provider readiness check.
2. Build query matrix by domain lane (`dev`, `marketing`, `finance`, `office-ops`, `hybrid`).
3. Retrieve evidence in grounded order:
- DeepWiki + Repomix first (project grounding)
- Context7 second (official references)
- Tavily + Exa third (external corroboration)
4. Build contradiction register and remove unsupported claims.
5. Score confidence and emit setup TODOs.

## Provider Contract
Required providers:
- Context7
- DeepWiki
- Repomix
- Tavily
- Exa (when provider/tool mode supports it)

If a provider is unavailable, continue research but downgrade confidence.

## Confidence Contract
- `full`: strong corroboration, zero critical gaps, zero unresolved contradictions.
- `partial`: usable evidence with some provider gaps or mild contradictions.
- `low`: major provider gaps or unresolved contradictions.

## DeepWiki QA Translation
Apply these implementation ideas while preserving output structure:
- Context shaping with transformed system/message layers.
- Silent context injection where appropriate.
- Explicit TODO tracking for unresolved research questions.

## References
- `references/provider-matrix.md`

## Template
- `templates/evidence-table.md`

## Scripts
- `scripts/check-mcp-readiness.mjs`
- `scripts/score-confidence.sh`
