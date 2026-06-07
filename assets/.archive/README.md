# assets/.archive

Archive for **superseded** or **out-of-scope** Hivemind assets.

| Subdir | Holds | Source spec |
|---|---|---|
| `dev-tooling/skills/` | Archived `gate-*`, `stack-*`, `gsd-*` skills (dev-tooling only) | 04-03 ADR §2.2 F4-F6; master plan §9.1 Q3 |
| `dev-tooling/agents/` | Archived agent candidates that did not ship | 04-03 §3 |
| `dev-tooling/agent-instructions/` | Archived AGENT.md fragments kept for reference | 04-03 §3 |
| `refactoring/build-orchestrator-handbook/` | Earlier front-facing orchestrator handbook drafts (predecessor) | master plan §13 Q4 |

**Rules:**

1. This directory is **NOT deployed** to `.opencode/` (see `scripts/sync-assets.js` PRIMITIVE_MAP).
2. Items here are **read-only** reference; do not import into shipped surfaces.
3. Authored: 2026-06-07 (AUDIT-04 Cycle 0 preflight, F-C resolution).
4. Owner: `hm-executor` (handoff to `hm-arch-refactor` for migration of current violations in a later phase).
