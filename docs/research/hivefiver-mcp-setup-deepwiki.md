# HiveFiver MCP Setup - DeepWiki

## Purpose
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

## Validation Steps
1. Confirm `deepwiki: ready` in `/hivefiver audit`.
2. Run `/hivefiver research` and verify DeepWiki-backed findings appear.
3. Ensure DeepWiki is used before broad web corroboration.

## Notes
- DeepWiki should be first-pass grounding for codebase questions.

## Links
- https://deepwiki.com/
