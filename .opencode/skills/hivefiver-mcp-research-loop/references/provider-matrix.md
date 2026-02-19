# MCP Provider Matrix

| Provider | Primary Role | Setup Key | Link |
|---|---|---|---|
| Context7 | Official docs/library references | Endpoint enablement | https://context7.com/ |
| DeepWiki | Repository synthesis and source navigation | Endpoint enablement | https://deepwiki.com/ |
| Repomix | Local repository packing/codemap export | `npx -y repomix --mcp` | https://repomix.com/guide/ |
| Tavily | Web retrieval and extraction | `TAVILY_API_KEY` | https://docs.tavily.com/ |
| Exa | Web/code-aware search enrichment | provider-specific | https://docs.exa.ai/ |

## Readiness States
- `ready`: configured and reachable.
- `misconfigured`: entry exists but invalid schema/command.
- `missing_credentials`: endpoint present, credentials missing.
- `disabled`: explicitly disabled.
- `unavailable_runtime`: network or runtime failures.

## Guidance
- Ground project claims with DeepWiki/Repomix before broad web search.
- Prefer Context7 for official API semantics.
- Use Tavily/Exa for corroboration, not sole truth.
