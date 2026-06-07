# dev-tooling/skills

Archive for **developer-tooling-only** skills that were discovered in shipped surfaces during AUDIT-04.

Per 04-03 ADR §2.2 (F4-F6) and master plan §9.1, Q3:
- `gate-*` → dev-tooling only; shipped surface uses `hm-gate-*`
- `stack-*` → dev-tooling only; shipped surface uses `hm-stack-authoring`
- `gsd-*` → dev-tooling only; lives in `.opencode/get-shit-done/`

**Initial state (2026-06-07):** empty placeholder. Population is a separate AUDIT-04 follow-up phase.

**Validator:** `assets/.hivemind-config/validate-name.sh` rejects these patterns with exit 1 (forbidden pattern F04/F05/F06).
