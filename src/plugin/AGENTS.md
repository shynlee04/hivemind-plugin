# src/plugin/ — Plugin Assembly Layer

Entry: `opencode-plugin.ts` — the sole file that registers hooks, tools, and the event handler with OpenCode.

## Boundary

This directory is **assembly only**. It composes hooks and tools — it must not contain business logic, state management, or tool implementations.

## Audit Findings (2026-03-16)

> [!NOTE]
> `hivemind_runtime_status` and `hivemind_runtime_command` are now extracted into `src/tools/runtime/tools.ts`. `opencode-plugin.ts` should remain assembly-only and must not regress back to inline tool logic.

### Current Enforcement

1. **Keep runtime tools extracted** in `src/tools/runtime/`
2. **Plugin entry must only**: import and register hooks, import and register tools, export the `Plugin`
3. **No tool logic** in this directory — all tool execute functions belong in `src/tools/`

## Files

| File | Purpose |
|------|---------|
| `opencode-plugin.ts` | Plugin factory — hook registration + tool assembly |
| `create-core-hooks.ts` | Constructs hook registration objects |
| `surface-registry.ts` | Published runtime registry of tools/hooks |
| `plugin-types.ts` | Plugin-internal types |
| `runtime-plan.ts` | Runtime capability planning |
| `messages-transform.ts` | Messages transform hook adapter |
| `system-transform.ts` | System transform hook adapter |
| `sdk-context.ts` | Caches `PluginInput` (client, shell, directory, worktree) |

## SDK Adoption Map (L2, 2026-03-15)

### Plugin Hooks — Adoption Decisions

| Hook | Decision | Responsible Module | Rationale |
|------|----------|-------------------|-----------|
| `event` | ✅ Adopted | `hooks/event-handler.ts` | All lifecycle events |
| `command.execute.before` | ✅ Adopted | `hooks/runtime-bridge/` | Pre-command context |
| `tool.execute.after` | ✅ Adopted | `hooks/runtime-loader/` | Post-tool state capture |
| `shell.env` | ✅ Adopted | plugin entry | Env injection |
| `system.transform` | ✅ Adopted | `hooks/context-injection/` | System prompt enrichment |
| `messages.transform` | ✅ Adopted | `hooks/prompt-transformation/` | Message history injection |
| `session.compacting` | ✅ Adopted | `hooks/workflow-integration/` | Compaction context |
| `chat.message` | 🔜 Adopt now | `hooks/start-work/` | Replace custom session tracking — gives sessionID, agent, model per message |
| `chat.params` | 🔜 Adopt now | `hooks/context-injection/` | Per-agent temperature control (hivefiver=0.7, hivemaker=0.3) |
| `permission.ask` | 🔜 Adopt now | new `hooks/permission/` | Gate `.hivemind/` state writes — makes pressure contracts enforceable |
| `tool.execute.before` | 🔜 Adopt now | `hooks/runtime-loader/` | Pre-validate tool args + inject session context |
| `tool.definition` | ⏳ Adopt later | — | Dynamic tool description enrichment — useful but not critical for 2.9.5 |
| `config` | ⏳ Adopt later | — | React to `opencode.json` changes at runtime |
| `chat.headers` | ❌ Reject | — | No custom auth headers needed |
| `auth` | ❌ Reject | — | Not a provider plugin |
| `text.complete` | ❌ Reject | — | No streaming text injection use case |

### Client API — Adoption Decisions

| API | Decision | Replaces | File |
|-----|----------|----------|------|
| `client.app.log()` | 🔜 Adopt now | Augments `shared/logging.ts` | `shared/logging.ts` |
| `client.tui.showToast()` | ✅ Adopted | Replaced earlier placeholder toast wiring | `hooks/soft-governance.ts` |
| `client.session.*` | 🔜 Adopt now | Custom session tracking | `hooks/start-work/` |
| `client.app.agents()` | ⏳ Adopt later | — | Runtime agent validation |
| `client.tool.ids()` | ⏳ Adopt later | — | Runtime tool validation |
| `client.tui.executeCommand()` | ⏳ Adopt later | — | Programmatic command execution |
| `client.vcs.*` | ❌ Reject | — | Not relevant |

### Hook Name Strategy

**Decision: No adapter layer.** Use SDK hook keys exactly as-is.

The `experimental.*` prefix is SDK 1.2.x naming. Building an adapter layer adds permanent complexity for a temporary prefix. When SDK stabilizes names:
- Single find-replace in `opencode-plugin.ts`
- Update AGENTS.md canonical names

In AGENTS.md documentation, use short canonical names for readability (e.g., `system.transform`), but code uses the actual SDK keys (e.g., `experimental.chat.system.transform`).

> [!IMPORTANT]
> **ADR**: Hook name adapter REJECTED. Cost/benefit negative — the adapter becomes tech debt the moment SDK drops `experimental.` prefix. See `docs/adr/001-no-hook-adapter.md`.
