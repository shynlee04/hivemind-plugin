# HiveFiver MCP Quickstart Wizard

## Goal
Get the HiveFiver non-negotiable MCP stack into a usable state quickly.

## Step 1: Start From Template
Use `.opencode/templates/opencode-config-template.json` and copy required MCP entries into `opencode.json`.

## Step 2: Configure Credentials
```bash
export TAVILY_API_KEY="<your_api_key>"
export EXA_API_KEY="<your_api_key>"   # only if your Exa mode requires it
export OPENCODE_ENABLE_EXA=1            # for provider-native Exa mode
```

## Step 3: Provider Enablement
- Enable DeepWiki first.
- Enable Context7 second.
- Enable Repomix for local packing.
- Enable Tavily and Exa when credentials are ready.

## Step 4: Validate End-to-End
1. Run `/hivefiver audit`.
2. Run `/hivefiver research`.
3. Confirm:
- provider status table is present
- confidence label is explicit
- missing-provider TODOs are emitted when needed

## Step 5: Fallback Policy
If any provider is unavailable:
- continue planning with downgraded confidence
- annotate caveats in outputs
- keep setup TODOs visible until resolved
