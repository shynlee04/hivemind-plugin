# HiveFiver MCP Setup - Exa

## Purpose
Enable Exa search enrichment using MCP endpoint or provider-native mode.

## Mode A: MCP Endpoint
```json
"exa": {
  "type": "remote",
  "url": "https://YOUR-EXA-MCP-ENDPOINT",
  "enabled": true,
  "timeout": 15000
}
```

## Mode B: Provider-Native Exa
```bash
export OPENCODE_ENABLE_EXA=1
```

Optional if provider requires:
```bash
export EXA_API_KEY="<your_api_key>"
```

## Validation Steps
1. Confirm Exa appears as `ready` or `provider-native enabled` in `/hivefiver audit`.
2. Confirm Exa-backed entries appear in evidence output.
3. Ensure confidence downgrade when Exa is expected but unavailable.

## Links
- https://docs.exa.ai/
