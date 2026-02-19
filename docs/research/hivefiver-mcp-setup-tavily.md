# HiveFiver MCP Setup - Tavily

## Goal
Enable Tavily for broad web retrieval and extraction workflows.

## Config Snippet
```json
"tavily": {
  "type": "remote",
  "url": "https://mcp.tavily.com/mcp",
  "enabled": true,
  "timeout": 15000
}
```

## API Key Setup
Set API key in shell (do not commit secrets):
```bash
export TAVILY_API_KEY="<your_api_key>"
```

If using `.env` or secret manager, map the same key name.

## Verification Checklist
1. Run readiness script and confirm no missing credentials.
2. Confirm Tavily appears in `source_quality_matrix`.
3. If key missing, keep provider disabled and emit remediation TODO.

## Reference
- https://docs.tavily.com/
