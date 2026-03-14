# HiveFiver Phase 4 - Agent and Workflow Orchestration

## Agent Updates
- Added `agents/hivefiver.md` as primary meta-builder contract.
- Promoted `explore.md` and `scanner.md` to canonical root `agents/`.

## Workflows Added
1. `workflows/hivefiver-vibecoder.yaml`
2. `workflows/hivefiver-enterprise.yaml`
3. `workflows/hivefiver-mcp-fallback.yaml`

## Required Guards
- context-first gate
- evidence gate
- MCP readiness gate
- export-cycle recording
- no execution without connected task graph
- schema gate for Ralph export

## Result
Both persona lanes are now codified with deterministic orchestration paths.
