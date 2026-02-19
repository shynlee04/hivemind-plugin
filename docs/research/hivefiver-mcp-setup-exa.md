# HiveFiver MCP Setup - Exa

## Goal
Enable Exa-based search enrichment through MCP endpoint or provider-native mode.

## Mode A: MCP Endpoint (if available)
```json
"exa": {
  "type": "remote",
  "url": "https://YOUR-EXA-MCP-ENDPOINT",
  "enabled": true,
  "timeout": 15000
}
```

## Mode B: Provider-Native
If your OpenCode model/provider already supports Exa tools:
```bash
export OPENCODE_ENABLE_EXA=1
```

Optionally set credential if your environment requires it:
```bash
export EXA_API_KEY="<your_api_key>"
```

## Verification Checklist
1. Confirm Exa appears as `ready` or `provider-native enabled` in doctor report.
2. Confirm Exa-sourced entries appear in evidence table.
3. If unavailable, continue with fallback and lower confidence.

## Reference
- https://docs.exa.ai/
