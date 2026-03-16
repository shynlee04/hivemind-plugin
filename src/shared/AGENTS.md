# src/shared/ — Cross-Cutting Utilities

Common modules used across the plugin.

## Audit Findings (2026-03-15)

> [!NOTE]
> **`event-bus.ts` was REMOVED** in L1 cutover. The SDK `event` hook + `client.tui.publish()` + `client.event.subscribe()` provide the same pub/sub pattern. Do NOT recreate an EventBus — see Authority Principle.

> [!IMPORTANT]
> **`logging.ts` should augment with `client.app.log()`** for structured server-side logging that persists beyond console. Custom `log()` is fine for dev, but production should use the SDK.

## Files

| File | Status | Purpose |
|------|--------|---------|
| `paths.ts` | ✅ | Centralized path builders — `getHivemindPath()`, `getStatePath()` |
| `tool-response.ts` | ✅ | Standard `{status, message, data}` response format |
| `bootstrap-profile.ts` | ✅ | User profile normalization |
| `runtime-attachment.ts` | ✅ | Settings load/save + runtime bindings snapshot |
| `pressure-contract.ts` | ✅ | Pressure contract registry and resolution |
| `opencode-knowledge.ts` | ✅ | OpenCode-specific knowledge surfaces |
| `opencode-agent-registry.ts` | ✅ | Canonical agent parsing + OpenCode-safe runtime projection |
| `logging.ts` | ⚠️ | Custom logger — supplement with `client.app.log()` |

## Runtime Projection Rule

- Root `agents/**` may carry HiveMind-only contract metadata for authoring and governance.
- `.opencode/agents/**` must be generated through `opencode-agent-registry.ts`, which strips non-SDK frontmatter and validates the remaining projection against the OpenCode-safe schema.
- Never copy canonical agent files directly into `.opencode/agents/**`.

## Dedup Needed

`parseList()` and `render()` are duplicated in `tools/handoff/`, `tools/task/`, `tools/trajectory/`. Extract to `shared/tool-helpers.ts`.
