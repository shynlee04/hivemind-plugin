# Conflict Ledger (Phase 0)

| ID | Status | Reproducible | Owner | Notes |
|---|---|---|---|---|
| HOOK-CLASH-001 | fixed | yes | hivehealer | Shared channel contract wired; plugin moved to fallback mode with deterministic shared-budget ledger. |
| TOOL-ACCESS-001 | fixed | yes | hivefiver | Minimal context-preservation allowlist added while keeping blind mode. |
| AGENT-OVERLAP-001 | fixed | yes | hivefiver | Canonical `agents/**` mirrored into `.opencode/agents/**` with parity guard. |
| SCOPE-BOUNDARY-001 | fixed | yes | hiveplanner | Docs ownership split: `docs/framework/**` vs `docs/implementation/**`. |
| SCOPE-BOUNDARY-002 | fixed | yes | hivehealer | Plugin direct state write removed from `.hivemind/state`; static write-boundary guard enforced in lint boundary checks. |
| TOOL-ACCESS-002 | fixed | yes | hivefiver | `read/glob/grep: deny` retained; investigation path enforced via delegation. |
