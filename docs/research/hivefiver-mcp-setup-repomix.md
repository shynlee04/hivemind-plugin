# HiveFiver MCP Setup - Repomix

## Purpose
Enable Repomix for local repository packaging and codemap-style synthesis.

## Config Snippet
```json
"repomix": {
  "type": "local",
  "command": ["npx", "-y", "repomix", "--mcp"],
  "enabled": true
}
```

## Validation Steps
1. Run `/hivefiver audit` and confirm `repomix: ready`.
2. Run `/hivefiver research` and verify Repomix-backed entries are present.
3. If unavailable, emit install TODO and downgrade confidence.

## Notes
- Prefer Repomix for local context before web-wide retrieval.

## Links
- https://github.com/yamadashy/repomix
- https://repomix.com/guide/
