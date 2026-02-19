# HiveFiver MCP Setup - Tavily

## Purpose
Enable Tavily for external retrieval and corroboration in research loops.

## API Setup
```bash
export TAVILY_API_KEY="<your_api_key>"
```

## Config Snippet
```json
"tavily": {
  "type": "remote",
  "url": "https://mcp.tavily.com/mcp",
  "enabled": true,
  "timeout": 15000
}
```

## Validation Steps
1. Run `/hivefiver audit` and confirm Tavily status.
2. Run `/hivefiver research` and verify Tavily appears in `source_quality_matrix`.
3. If key is missing, keep provider disabled and emit remediation TODO.

## Notes
- Tavily should corroborate, not replace DeepWiki/Context7/Repomix grounding.

## Links
- https://docs.tavily.com/
