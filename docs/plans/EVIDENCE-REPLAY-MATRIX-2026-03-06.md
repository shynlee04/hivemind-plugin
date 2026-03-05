# Evidence Replay Matrix (Phase 1)

## Critical Replay

| ID | Evidence Anchor | Classification |
|---|---|---|
| HOOK-CLASH-001 | `src/lib/injection-orchestrator.ts`, `src/hooks/session-lifecycle.ts`, `src/hooks/messages-transform.ts`, `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` | confirmed → resolved by shared marker detection + fallback-only plugin path |
| TOOL-ACCESS-001 | `agents/hivefiver.md` permission block | confirmed |
| AGENT-OVERLAP-001 | `agents/*.md` vs `.opencode/agents/*.md` parity drift | confirmed |
| SCOPE-BOUNDARY-001 | overlapping `docs/**` scopes in agent contracts | confirmed |
| SCOPE-BOUNDARY-002 | plugin-side lineage write to `.hivemind/state/brain.json` | confirmed → resolved by profile-only persistence + state write boundary guard |
| TOOL-ACCESS-002 | blind-mode deny + insufficient context tools | confirmed |

## Severity Re-Score

- HOOK-CLASH-001: Critical → Resolved
- TOOL-ACCESS-001: Critical → Resolved
- AGENT-OVERLAP-001: Critical → Resolved
- SCOPE-BOUNDARY-001: Critical → Resolved
- SCOPE-BOUNDARY-002: Critical → Resolved
- TOOL-ACCESS-002: Critical → Resolved
