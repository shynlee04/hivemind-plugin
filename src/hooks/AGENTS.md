# src/hooks/ — Read-Side Context Injection (CQRS)

Hooks are read-only observers. They inject context into agent sessions via synthetic `Part` objects. They never mutate state.

## Boundary

7 sub-modules, each handling a specific lifecycle concern:

| Sub-Module | Hook Events | Purpose |
|------------|-------------|---------|
| `start-work/` | `chat.message` (implied) | Purpose classification, lineage, readiness gates, trajectory assessment |
| `context-injection/` | `system.transform` | System prompt enrichment — governance, session packet, knowledge surfaces |
| `prompt-transformation/` | `messages.transform` | Synthetic part injection into message history |
| `runtime-bridge/` | `command.execute.before` | Load command assets, resolve runtime contracts |
| `runtime-loader/` | `tool.execute.after` | Post-tool state observation and metadata capture |
| `auto-slash-command/` | `chat.message` | Auto-detect and route slash commands |
| `workflow-integration/` | `session.compacting` | Inject workflow context into compaction |

## Audit Findings (2026-03-15)

> [!IMPORTANT]
> `start-work/` is the **real** session lifecycle — not `core/session/`. This is where purpose classification, lineage resolution, readiness gates, trajectory assessment, and control-plane gating happen.

> [!NOTE]
> `soft-governance.ts` now uses `client.tui.showToast()` with cooldown tracking. Keep notifications lightweight and non-blocking.

### Available But Unused Hooks

These SDK hooks could enhance the current design:

| Hook | Potential Use |
|------|--------------|
| `tool.execute.before` | Pre-validate tool args before execution |
| `tool.definition` | Dynamically modify tool descriptions per-session |
| `chat.params` | Control temperature/topP per-agent lineage |
| `permission.ask` | Gate state mutations with user consent |
| `config` | React to config changes at runtime |

## Key Files

| File | Weight | Role |
|------|--------|------|
| `start-work/start-work-router.ts` | ~467 tokens | Heaviest hook — orchestrates full session entry |
| `context-injection/governance-layer.ts` | ~200 tokens | Builds governance injection packet |
| `prompt-transformation/synthetic-parts.ts` | ~150 tokens | Creates Part objects for agent context |

## Rules

- Hooks are **read-only** — never write to `.hivemind/` state
- Hooks inject context via `Part` objects, never via return values
- Each hook file ≤ 200 LOC — split if larger
- Use `sdk-context.ts` for cached client/shell references
