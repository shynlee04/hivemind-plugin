# Root `agents/` — Agent Source Authority

## Status: LEGACY SOURCE (Still Active)

## Classification

| File | Classification | Reason |
|------|---------------|--------|
| `hivefiver.deprecated.md` | **LEGACY SOURCE** | Canonical source for hivefiver agent; projected via `opencode-agent-registry.ts` |
| `hivemaker.deprecated.md` | **LEGACY SOURCE** | Canonical source for hivemaker agent |
| `hiveminder.deprecated.md` | **LEGACY SOURCE** | Canonical source for hiveminder agent |
| `hiveplanner.deprecated.md` | **LEGACY SOURCE** | Canonical source for hiveplanner agent |
| `hiveq.deprecated.md` | **LEGACY SOURCE** | Canonical source for hiveq agent |
| `hivehealer.deprecated.md` | **LEGACY SOURCE** | Canonical source for hivehealer agent |
| `hivexplorer.deprecated.md` | **LEGACY SOURCE** | Canonical source for hivexplorer agent |
| `hiverd.deprecated.md` | **LEGACY SOURCE** | Canonical source for hiverd agent |
| `hitea.deprecated.md` | **LEGACY SOURCE** | Canonical source for hitea agent |

## Authority

These files are the **canonical source** for the 9 registered agents defined in `OPENCODE_AGENT_REGISTRY_IDS` (`src/shared/opencode-agent-registry.ts:40-50`).

The `opencode-agent-registry.ts` reads from `agents/*.deprecated.md` and projects runtime frontmatter to `.opencode/agents/`.

## Why Deprecated Suffix

The `.deprecated.md` suffix indicates these are **legacy authoring format** - they use YAML frontmatter + markdown body. The modern approach uses `.opencode/agents/*.md` projections directly. However, since `opencode-agent-registry.ts` still reads from `agents/`, these files remain the runtime authority.

## Do Not Reconnect

Do not create new `agents/*.md` files or reconnect this directory to other systems:
- This is a legacy projection mechanism
- The registry is read-only in-memory as of 2026-03-22
- Any new agents should be authored in `.opencode/agents/` directly
