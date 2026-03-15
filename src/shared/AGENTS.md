# src/shared/ — Cross-Cutting Utilities

Common modules used across the plugin.

## Audit Findings (2026-03-15)

> [!WARNING]
> **`event-bus.ts` reimplements SDK events.** OpenCode's `event` hook + `client.tui.publish()` + `client.event.subscribe()` provide the same pub/sub pattern with SDK-native observability. Do not extend EventBus — wire new events through SDK.

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
| `logging.ts` | ⚠️ | Custom logger — supplement with `client.app.log()` |
| `event-bus.ts` | ⛔ Deprecated | Custom EventBus — use SDK event system instead |

## Dedup Needed

`parseList()` and `render()` are duplicated in `tools/handoff/`, `tools/task/`, `tools/trajectory/`. Extract to `shared/tool-helpers.ts`.
