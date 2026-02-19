# HiveFiver MCP Setup - Repomix

## Goal
Enable local repository packing for deep codebase context and codemap-like extraction.

## Config Snippet
```json
"repomix": {
  "type": "local",
  "command": ["npx", "-y", "repomix", "--mcp"],
  "enabled": true
}
```

## Verification Checklist
1. Run command manually once to confirm binary resolution.
2. Run `hivefiver-research` and confirm Repomix-backed entries.
3. If unavailable, emit install TODO and downgrade confidence.

## References
- https://github.com/yamadashy/repomix
- https://repomix.com/guide/
