# HiveFiver MCP Setup - Context7

## Purpose
Enable Context7 for official library/API semantics in HiveFiver research flows.

## Config Snippet
```json
"context7": {
  "type": "remote",
  "url": "https://mcp.context7.com/mcp",
  "enabled": true,
  "timeout": 15000
}
```

## Validation Steps
1. Run `/hivefiver audit` and confirm `context7: ready`.
2. Run `/hivefiver research` and verify Context7 appears in `source_quality_matrix`.
3. If unavailable, confidence must downgrade and remediation TODO must be emitted.

## Notes
- Use Context7 as canonical source for official API semantics.
- Do not rely on Context7 alone for repo-specific claims.

## Links
- https://context7.com/
