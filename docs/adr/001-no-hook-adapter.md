# ADR-001: No Hook Adapter Layer

## Status
**Accepted** — 2.9.5

## Context
The OpenCode SDK uses long experimental hook names (e.g., `experimental.chat.messages.transform`). An adapter layer was considered to canonicalize these to shorter names.

## Decision
**No adapter.** Register hooks using their actual SDK names directly.

## Rationale
1. **Single source of truth** — Grep for a hook name finds exactly where it's registered
2. **Zero drift** — No mapping table that goes stale when the SDK renames hooks
3. **SDK upgrades are mechanical** — When `experimental.*` becomes stable, a find-and-replace is sufficient
4. **No runtime overhead** — No adapter dispatch, no name resolution

## Consequences
- Hook registrations use verbose SDK names
- When SDK graduates hooks from experimental, we do a simple string rename
- New team members reference `src/plugin/AGENTS.md` for the hook adoption map
