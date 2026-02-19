---
name: hivefiver-mcp-research-loop
description: Run iterative MCP-backed research with provider readiness checks, confidence scoring, contradiction control, and fallback governance.
---

# HiveFiver MCP Research Loop

Use this skill when planning or architecture decisions require evidence-backed research.

## Workflow
1. Run provider readiness check.
2. Build query matrix by domain lane.
3. Retrieve evidence in grounded order:
- DeepWiki + Repomix (repository grounding)
- Context7 (official semantics)
- Tavily + Exa (external corroboration)
4. Build contradiction register.
5. Score confidence and emit setup TODOs.

## Provider Contract
Required providers:
- Context7
- DeepWiki
- Repomix
- Tavily
- Exa (MCP or provider-native)

If any provider is unavailable, continue but downgrade confidence.

## Confidence Contract
- `full`: corroborated, no critical gaps.
- `partial`: usable with non-critical gaps.
- `low`: critical gaps or unresolved contradictions.

## Retry Contract
- Validate contradictions up to 10 iterations.
- At attempt 10, force explicit caveat block.

## DeepWiki QA Translation
- Use transformed context layers for control.
- Keep output structure stable.
- Treat TODO/task updates as first-class state.

## References
- `references/provider-matrix.md`

## Template
- `templates/evidence-table.md`

## Scripts
- `scripts/check-mcp-readiness.mjs`
- `scripts/score-confidence.sh`
