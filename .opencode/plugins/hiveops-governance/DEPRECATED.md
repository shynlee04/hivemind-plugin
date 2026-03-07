# ⛔ DEPRECATED — 2026-03-08

This plugin is **disabled**. All governance is now owned by `src/hooks/`.

See `AGENTS.md` §Dual-Injection Systems for context.

## Canonical Replacements

| Deprecated Hook | Replacement in `src/hooks/` |
|---|---|
| `hooks/delegation.ts` | `tool-gate.ts` + `soft-governance.ts` |
| `hooks/events.ts` | `event-handler.ts` + `session-lifecycle.ts` |
| `hooks/compaction.ts` | `compaction.ts` |
| `hooks/context-injection.ts` | `messages-transform.ts` |
| `hooks/entry-guard.ts` | `session-lifecycle.ts` |
| `hooks/intent-classifier.ts` | `session-lifecycle.ts` (via skill-loader) |

## Why Disabled

1. References nonexistent GX-Pack scripts (`gx-enforce.sh`, `gx-trace-check.sh`, etc.)
2. Deep cross-layer imports between `.opencode/` and `src/`
3. Duplicates governance already handled by canonical `src/hooks/*`
4. Creates dual-injection conflict (HM-01) documented in `AGENTS.md`
