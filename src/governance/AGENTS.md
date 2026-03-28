# src/governance/ — Governance Rules & Policy Engine

Policy enforcement layer for HiveMind governance rules.

## Boundary

- **Read-side**: Evaluates rules against current state
- **No direct writes**: Governance outputs flow through hooks or tools
- **Owner**: Plugin-level governance assembly

## Rules

- Policy definitions are declarative (JSON/markdown), not imperative code
- Governance decisions are advisory — enforcement happens in hooks/plugin
- Keep policy files under 200 lines each
