# HiveFiver MCP Setup - Context7

## Goal
Enable Context7 for official library/API reference retrieval.

## Config Snippet
```json
"context7": {
  "type": "remote",
  "url": "https://mcp.context7.com/mcp",
  "enabled": true,
  "timeout": 15000
}
```

## Verification Checklist
1. Run `hivefiver-doctor` and confirm `context7: ready`.
2. Run `hivefiver-research` and verify Context7 appears in source matrix.
3. If unavailable, downgrade confidence and emit setup TODO.

## Reference
- https://context7.com/
