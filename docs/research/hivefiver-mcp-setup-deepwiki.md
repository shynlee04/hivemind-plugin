# HiveFiver MCP Setup - DeepWiki

## Goal
Enable DeepWiki for repository-level synthesis and source-linked analysis.

## Config Snippet
```json
"deepwiki": {
  "type": "remote",
  "url": "https://mcp.deepwiki.com/mcp",
  "enabled": true,
  "timeout": 15000
}
```

## Verification Checklist
1. Confirm `deepwiki: ready` in doctor output.
2. Query a repo topic and verify source-tagged response.
3. If unavailable, continue with fallback providers and confidence downgrade.

## Reference
- https://deepwiki.com/
