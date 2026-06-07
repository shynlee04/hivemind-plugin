# dev-tooling

Holds **developer-tooling-only** Hivemind assets (gate-*, stack-*, gsd-*, etc.) that were **discovered in shipped surfaces** during AUDIT-04 and need to be archived rather than shipped.

Per 04-03 ADR §2.2 (F4-F6) and master plan §9.1, Q3:
- `gate-*` → dev-tooling only; shipped surface uses `hm-gate-*`
- `stack-*` → dev-tooling only; shipped surface uses `hm-stack-authoring`
- `gsd-*` → dev-tooling only; lives in `.opencode/get-shit-done/`

| Subdir | Holds |
|---|---|
| `skills/` | Archived skills (gate-*, stack-*, gsd-*) |
| `agents/` | Archived agent candidates that did not ship |
| `agent-instructions/` | Archived AGENT.md / instruction fragments |

**Initial state (2026-06-07):** empty placeholder READMEs. Population is a separate AUDIT-04 follow-up phase.

**Validator:** `assets/.hivemind-config/validate-name.sh` rejects these patterns with exit 1 (forbidden pattern F04 / F05 / F06).
