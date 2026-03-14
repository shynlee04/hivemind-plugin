# HiveFiver Phase 5 - MCP Integration and Setup (Hardened)

## Non-Negotiable Providers
- Context7
- DeepWiki
- Repomix
- Tavily
- Exa (MCP or provider-native mode)

## Template Updates
`templates/opencode-config-template.json` includes:
- explicit MCP entries for the stack,
- Tavily/Exa environment guidance,
- Exa MCP placeholder + provider-native mode note.

## Setup Playbooks
- `docs/research/hivefiver-mcp-setup-context7.md`
- `docs/research/hivefiver-mcp-setup-deepwiki.md`
- `docs/research/hivefiver-mcp-setup-tavily.md`
- `docs/research/hivefiver-mcp-setup-repomix.md`
- `docs/research/hivefiver-mcp-setup-exa.md`

## Operational Scripts
- `skills/hivefiver-mcp-research-loop/scripts/check-mcp-readiness.mjs`
- `skills/hivefiver-mcp-research-loop/scripts/score-confidence.sh`

## Confidence Model
- `full`: strong corroboration, no critical gaps, no unresolved contradictions.
- `partial`: usable evidence with managed gaps.
- `low`: major gaps or unresolved contradictions.

## Policy
Graceful degradation is mandatory. No fake full-confidence output.
